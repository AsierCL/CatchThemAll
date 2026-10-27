package usc.enser.CatchThemAll.service.implementation;

import com.example.grpc.*;
import com.google.common.util.concurrent.FutureCallback;
import com.google.common.util.concurrent.MoreExecutors;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.protobuf.ByteString;

import usc.enser.CatchThemAll.exception.ApiException;
import usc.enser.CatchThemAll.persistence.entities.Captures;
import usc.enser.CatchThemAll.persistence.entities.Famous;
import usc.enser.CatchThemAll.persistence.entities.User;
import usc.enser.CatchThemAll.persistence.repositories.CaptureRepository;
import usc.enser.CatchThemAll.persistence.repositories.FamousRepository;
import usc.enser.CatchThemAll.persistence.repositories.UserRepository;
import usc.enser.CatchThemAll.presentation.dto.CaptureCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.CaptureCreateResponse;
import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;
import usc.enser.CatchThemAll.service.interfaces.ICaptureService;

@Service
public class CaptureServiceImpl implements ICaptureService {

    private static final double CAPTURE_SIMILARITY_THRESHOLD = 0.8;

    private final CaptureServiceGrpc.CaptureServiceFutureStub captureServiceStub;
    private final CaptureRepository captureRepository;
    private final FamousRepository famousRepository;
    private final UserRepository userRepository;
    private final Executor executor;

    public CaptureServiceImpl(CaptureRepository captureRepository,
                              FamousRepository famousRepository,
                              UserRepository userRepository,
                              CaptureServiceGrpc.CaptureServiceFutureStub captureServiceStub,
                              Executor grpcExecutor) {
        this.captureRepository = captureRepository;
        this.famousRepository = famousRepository;
        this.userRepository = userRepository;
        this.captureServiceStub = captureServiceStub;
        this.executor = grpcExecutor;
    }

    @Override
    public CompletableFuture<CaptureResponse> identify(UUID userId, MultipartFile image,
                                                       CaptureCreateRequest request) throws IOException {
        if (image == null || image.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "image is required");
        }
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "famous name is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user not found"));
        Famous famous = famousRepository.findByName(request.name().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "famous not found"));

        CaptureIdentifyRequest identifyRequest = CaptureIdentifyRequest.newBuilder()
                .setImage(ByteString.copyFrom(image.getBytes()))
                .setName(famous.getName())
                .build();

        //Esperamos la respuesta
        ListenableFuture<CaptureIdentifyResponse> futureResponse =
                captureServiceStub.identify(identifyRequest);

        //Cambiamos el tipo de dato devuelto
        ListenableFuture<CaptureResponse> guavaFuture = Futures.transform(
                futureResponse,
                identifyResponse -> {
                    if (identifyResponse == null) {
                        throw new IllegalStateException("No se pudo completar la identificación");
                    }
                    Captures capture = new Captures();
                    capture.setUser(user);
                    capture.setFamous(famous);
                    capture.setTimestamp(new Timestamp(System.currentTimeMillis()));
                    //capture.setPhotoUrl();
                    boolean captured = captureRepository.findByCaptureFamousAndUser(famous, user).isPresent();
                    Captures savedCapture = captureRepository.save(capture);
                    return new CaptureResponse(savedCapture.getCaptureId(),famous.getFamousId(),
                            famous.getName(), identifyResponse.getSimilarity(),captured,savedCapture.getTimestamp());
                },
                executor);

        //Pasamos a CompletableFuture
        CompletableFuture<CaptureResponse> result = new CompletableFuture<>();

        Futures.addCallback(guavaFuture, new FutureCallback<>() {
            @Override
            public void onSuccess(CaptureResponse r) {
                result.complete(r);
            }

            @Override
            public void onFailure(Throwable t) {
                result.completeExceptionally(t);
            }
        }, MoreExecutors.directExecutor());

        return result;
    }

    public CompletableFuture<CaptureCreationResponse> create(MultipartFile image, CaptureCreateRequest request) throws IOException{

        byte[] bytes = image.getBytes();
        String name = request.name();

        CaptureCreationRequest creationRequest = CaptureCreationRequest.newBuilder()
                .setImage(ByteString.copyFrom(bytes))
                .setName(name)
                .build();

        ListenableFuture<CaptureCreationResponse> futureResponse =
                captureServiceStub.create(creationRequest);

        CompletableFuture<CaptureCreationResponse> result = new CompletableFuture<>();

        Futures.addCallback(futureResponse, new FutureCallback<CaptureCreationResponse>() {
            @Override
            public void onSuccess(CaptureCreationResponse r) {
                result.complete(r);
            }

            @Override
            public void onFailure(Throwable t) {
                result.completeExceptionally(t);
            }
        }, MoreExecutors.directExecutor());

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CaptureResponse> findMine(UUID userId) {
        User user = getUserOrThrow(userId);
        return captureRepository.findAllByUserOrderByTimestampDesc(user).stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CaptureResponse findMineById(UUID userId, UUID captureId) {
        User user = getUserOrThrow(userId);
        Captures capture = captureRepository.findByCaptureIdAndUser(captureId, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "capture not found"));
        return toHistoryResponse(capture);
    }

    private CaptureResponse recordIfCaptured(User user, Famous famous, CaptureIdentifyResponse response) {
        double similarity = response.getSimilarity();
        if (!(similarity >= CAPTURE_SIMILARITY_THRESHOLD)) {
            return new CaptureResponse(null, famous.getFamousId(), famous.getName(), similarity, false, null);
        }

        Captures capture = new Captures();
        capture.setUser(user);
        capture.setFamous(famous);
        capture.setTimestamp(Timestamp.from(Instant.now()));
        capture.setSimilarity(similarity);
        return toHistoryResponse(captureRepository.save(capture));
    }

    private CaptureResponse toHistoryResponse(Captures capture) {
        Double similarity = capture.getSimilarity();
        return new CaptureResponse(
                capture.getCaptureId(),
                capture.getFamous().getFamousId(),
                capture.getFamous().getName(),
                similarity == null ? 0.0 : similarity,
                true,
                capture.getTimestamp());
    }

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user not found"));
    }
}

package usc.enser.CatchThemAll.service.implementation;

import com.example.grpc.*;
import com.google.common.util.concurrent.FutureCallback;
import com.google.common.util.concurrent.MoreExecutors;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.jspecify.annotations.NonNull;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.protobuf.ByteString;

import usc.enser.CatchThemAll.exception.ApiException;
import usc.enser.CatchThemAll.exception.RecognitionServiceUnavailableException;
import usc.enser.CatchThemAll.persistence.entities.Captures;
import usc.enser.CatchThemAll.persistence.entities.Famous;
import usc.enser.CatchThemAll.persistence.entities.User;
import usc.enser.CatchThemAll.persistence.repositories.CaptureRepository;
import usc.enser.CatchThemAll.persistence.repositories.FamousRepository;
import usc.enser.CatchThemAll.persistence.repositories.UserRepository;
import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;
import usc.enser.CatchThemAll.service.interfaces.ICaptureService;
import usc.enser.CatchThemAll.service.interfaces.IScoreService;

@Service
public class CaptureServiceImpl implements ICaptureService {

    //private static final double CAPTURE_SIMILARITY_THRESHOLD = 0.8;

    private final CaptureServiceGrpc.CaptureServiceFutureStub captureServiceStub;
    private final IScoreService scoreService;
    private final CaptureRepository captureRepository;
    private final FamousRepository famousRepository;
    private final UserRepository userRepository;
    private final Executor executor;

    public CaptureServiceImpl(IScoreService scoreService, CaptureRepository captureRepository,
                              FamousRepository famousRepository,
                              UserRepository userRepository,
                              CaptureServiceGrpc.CaptureServiceFutureStub captureServiceStub,
                              Executor grpcExecutor) {
        this.scoreService = scoreService;
        this.captureRepository = captureRepository;
        this.famousRepository = famousRepository;
        this.userRepository = userRepository;
        this.captureServiceStub = captureServiceStub;
        this.executor = grpcExecutor;
    }

    @Override
    @CircuitBreaker(name = "facialRecognition", fallbackMethod = "recognitionFallback")
    public CompletableFuture<CaptureResponse> identify(UUID userId, MultipartFile image,
                                                       String name) throws IOException {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user not found"));

        Famous famous = famousRepository.findByName(name.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "famous not found"));

        CaptureIdentifyRequest identifyRequest = CaptureIdentifyRequest.newBuilder()
                .setImage(ByteString.copyFrom(image.getBytes()))
                .setName(famous.getName())
                .build();

        ListenableFuture<CaptureIdentifyResponse> futureResponse =
                captureServiceStub.identify(identifyRequest);

        CompletableFuture<CaptureResponse> result = new CompletableFuture<>();

        Futures.addCallback(futureResponse, new FutureCallback<>() {
            @Override
            public void onSuccess(CaptureIdentifyResponse response) {
                try {
                    if (response == null) {
                        throw new IllegalStateException(
                                "No se pudo completar la identificación");
                    }

                    double similarity = response.getSimilarity();

                    // Preparamos la captura, pero todavía no la guardamos.
                    Captures capture = createCaptureIfCaptured(user, famous, similarity);

                    // finishFuture se encarga de guardar la captura y actualizar
                    // la puntuación cuando corresponda.
                    scoreService.finishFuture(name, similarity, userId, capture);

                    CaptureResponse captureResponse;

                    if (capture != null) {
                        captureResponse = toHistoryResponse(capture);
                    } else {
                        captureResponse = new CaptureResponse(
                                null,
                                famous.getFamousId(),
                                famous.getName(),
                                similarity,
                                false,
                                null
                        );
                    }

                    result.complete(captureResponse);

                } catch (Exception e) {
                    result.completeExceptionally(e);
                }
            }

            @Override
            public void onFailure(@NonNull Throwable t) {
                result.completeExceptionally(t);
            }
        }, MoreExecutors.directExecutor());

        return result;
    }

    public CompletableFuture<CaptureCreationResponse> create(MultipartFile image, String name) throws IOException{

        byte[] bytes = image.getBytes();

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
    @Cacheable(cacheNames = "captures", key = "#userId", unless = "#result == null")
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

    private CompletableFuture<CaptureResponse> recognitionFallback (UUID userId, MultipartFile image,
                                                                    String name, Throwable exception){

        System.out.println("Excepción recibida por el fallback: "
                + exception.getClass().getName());
        exception.printStackTrace();

        return CompletableFuture.failedFuture(
                new RecognitionServiceUnavailableException(
                        "Facial recognition service unavailable", exception
                )
        );
    }

    private Captures createCaptureIfCaptured(User user, Famous famous,
                                             double similarity) {
        /*if (!(similarity >= CAPTURE_SIMILARITY_THRESHOLD)) {
            return null;
        }*/

        Captures capture = new Captures();
        capture.setUser(user);
        capture.setFamous(famous);
        capture.setTimestamp(Timestamp.from(Instant.now()));
        capture.setSimilarity(similarity);

        return capture;
    }

    private CaptureResponse toHistoryResponse(Captures capture) {
        Double similarity = capture.getSimilarity();
        boolean repeated = capture.getTimestamp() != null &&
                captureRepository.existsByFamousAndUserAndTimestampBefore(
                        capture.getFamous(), capture.getUser(), capture.getTimestamp());
        return new CaptureResponse(
                capture.getCaptureId(),
                capture.getFamous().getFamousId(),
                capture.getFamous().getName(),
                similarity == null ? 0.0 : similarity,
                repeated,
                capture.getTimestamp());
    }

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user not found"));
    }
}

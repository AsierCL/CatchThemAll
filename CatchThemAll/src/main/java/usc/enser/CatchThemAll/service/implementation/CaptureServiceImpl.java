package usc.enser.CatchThemAll.service.implementation;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.grpc.CaptureIdentifyRequest;
import com.example.grpc.CaptureIdentifyResponse;
import com.example.grpc.CaptureServiceGrpc;
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
    public ListenableFuture<CaptureResponse> identify(UUID userId, MultipartFile image,
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

        ListenableFuture<CaptureIdentifyResponse> identifyFuture = captureServiceStub.identify(identifyRequest);
        return Futures.transform(identifyFuture, response -> recordIfCaptured(user, famous, response), executor);
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

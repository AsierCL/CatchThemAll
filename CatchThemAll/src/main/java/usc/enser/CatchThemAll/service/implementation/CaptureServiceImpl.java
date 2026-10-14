package usc.enser.CatchThemAll.service.implementation;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import com.example.grpc.*;
import com.google.common.util.concurrent.FutureCallback;
import com.google.common.util.concurrent.MoreExecutors;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.protobuf.ByteString;

import usc.enser.CatchThemAll.config.SecurityConfig;
import usc.enser.CatchThemAll.persistence.entities.Captures;
import usc.enser.CatchThemAll.persistence.repositories.CaptureRepository;
import usc.enser.CatchThemAll.presentation.dto.CaptureCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.CaptureCreateResponse;
import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;
import usc.enser.CatchThemAll.service.interfaces.ICaptureService;

@Service
public class CaptureServiceImpl implements ICaptureService{

    private final SecurityConfig securityConfig;

    private final Executor executor;

    private final CaptureServiceGrpc.CaptureServiceFutureStub captureServiceStub;

    private final CaptureRepository captureRepository;

    public CaptureServiceImpl(CaptureRepository captureRepository,
                            CaptureServiceGrpc.CaptureServiceFutureStub captureServiceStub,
                            SecurityConfig securityConfig,
                            Executor grpcExecutor) {
        this.captureRepository = captureRepository;
        this.captureServiceStub = captureServiceStub;
        this.securityConfig = securityConfig;
        this.executor = grpcExecutor;
    }

    public CompletableFuture<CaptureResponse> identify(MultipartFile image, CaptureCreateRequest request) throws IOException{

        byte[] bytes = image.getBytes();
        String name = request.name();

        CaptureIdentifyRequest identifyRequest = CaptureIdentifyRequest.newBuilder()
                .setImage(ByteString.copyFrom(bytes))
                .setName(name)
                .build();

        ListenableFuture<CaptureIdentifyResponse> futureResponse =
                captureServiceStub.identify(identifyRequest);

        ListenableFuture<CaptureResponse> guavaFuture = Futures.transform(
                futureResponse,
                identifyResponse -> {
                    //Captures capture = new Captures();
                    // rellenar con request e identifyResponse
                    //captureRepository.save(capture);
                    return new CaptureResponse(request.name(), identifyResponse.getSimilarity());
                },
                executor);

        CompletableFuture<CaptureResponse> result = new CompletableFuture<>();

        Futures.addCallback(guavaFuture, new FutureCallback<CaptureResponse>() {
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

}

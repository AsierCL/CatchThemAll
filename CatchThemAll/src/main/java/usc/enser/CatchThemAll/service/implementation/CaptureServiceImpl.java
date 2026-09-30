package usc.enser.CatchThemAll.service.implementation;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import usc.enser.CatchThemAll.config.SecurityConfig;
import usc.enser.CatchThemAll.persistence.repositories.CaptureRepository;
import usc.enser.CatchThemAll.presentation.dto.CaptureCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;
import usc.enser.CatchThemAll.config.AsyncConfig;

import com.example.grpc.CaptureIdentifyRequest;
import com.example.grpc.CaptureIdentifyResponse;
import com.example.grpc.CaptureServiceGrpc;
import com.google.protobuf.ByteString;
import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.FutureCallback;
import com.google.common.util.concurrent.ListenableFuture;

import java.util.concurrent.Executor;
import java.io.IOException;

import usc.enser.CatchThemAll.persistence.entities.Captures;
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

    public ListenableFuture<CaptureResponse> identify (MultipartFile image, CaptureCreateRequest request) throws IOException{

        byte[] bytes = image.getBytes();
        String name = request.name();

        CaptureIdentifyRequest identifyRequest = CaptureIdentifyRequest.newBuilder()
                .setImage(ByteString.copyFrom(bytes))
                .setName(name)
                .build();

        ListenableFuture<CaptureIdentifyResponse> futureResponse = captureServiceStub.identify(identifyRequest);

        //TODO
        //Completar con los futuros datos del CaptureCreateRequest

        return Futures.transform(
            futureResponse,
            identifyResponse -> {

                Captures capture = new Captures();
                captureRepository.save(capture);

                return new CaptureResponse(request.name());
            },executor
        );
    }

}

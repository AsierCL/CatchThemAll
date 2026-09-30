package usc.enser.CatchThemAll.presentation.controller;

import java.util.concurrent.Executor;
import java.io.IOException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;

import usc.enser.CatchThemAll.presentation.dto.CaptureCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;
import usc.enser.CatchThemAll.service.interfaces.ICaptureService;

@RestController
@RequestMapping("/captures")
public class CaptureController {

    private final ICaptureService captureService;

    private final Executor executor;

    public CaptureController(ICaptureService captureService, Executor grpcExecutor) {
        this.captureService = captureService;
        this.executor = grpcExecutor;
    }

    @PostMapping("/identify")
    public ListenableFuture<ResponseEntity<CaptureResponse>> identify(@RequestPart("image") MultipartFile image,
                                                                    @RequestPart("data") CaptureCreateRequest request) throws IOException{
        return Futures.transform(
            captureService.identify(image,request),
            ResponseEntity::ok,
            executor
        );
    }

}

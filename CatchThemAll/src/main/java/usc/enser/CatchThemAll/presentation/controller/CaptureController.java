package usc.enser.CatchThemAll.presentation.controller;

import java.util.concurrent.CompletableFuture;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executor;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;

import usc.enser.CatchThemAll.presentation.dto.CaptureCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;
import usc.enser.CatchThemAll.service.interfaces.ICurrentUserService;
import usc.enser.CatchThemAll.service.interfaces.ICaptureService;

@RestController
@RequestMapping("/captures")
public class CaptureController {

    private final ICaptureService captureService;
    private final ICurrentUserService currentUserService;
    private final Executor executor;

    public CaptureController(ICaptureService captureService, ICurrentUserService currentUserService,
                             Executor grpcExecutor) {
        this.captureService = captureService;
        this.currentUserService = currentUserService;
        this.executor = grpcExecutor;
    }

    @PostMapping("/identify")
    public CompletableFuture<CaptureResponse> identify(
            @PathVariable UUID id,
            @RequestPart("image") MultipartFile image,
            @RequestPart("data") @Valid CaptureCreateRequest request) throws IOException{

        return captureService.identify(id,image,request);
    }

    @PostMapping("/create")
    public CompletableFuture<ResponseEntity<Void>> create(
            @RequestPart("image") MultipartFile image,
            @RequestPart("data") @Valid CaptureCreateRequest request) throws IOException {

        return captureService.create(image, request)
                .thenApply(response ->
                        ResponseEntity.status(HttpStatus.CREATED).build()
                );
    }


}

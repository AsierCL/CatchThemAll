package usc.enser.CatchThemAll.presentation.controller;

import java.nio.file.AccessDeniedException;
import java.util.concurrent.CompletableFuture;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.Executor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping("/{id}/identify")
    public CompletableFuture<CaptureResponse> identify(
            @PathVariable UUID id,
            @RequestPart("image") MultipartFile image,
            @RequestPart("name") @NotBlank @NotNull String name) throws IOException{

        if(currentUserService.getCurrentUserId().equals(id)){
            return captureService.identify(id,image,name);
        }else {
            throw new AccessDeniedException("No puedes subir capturas por otro usuario");
        }

    }

    @PostMapping("/create")
    public CompletableFuture<ResponseEntity<Void>> create(
            @RequestPart("image") MultipartFile image,
            @RequestPart("data") @NotBlank @NotNull String name) throws IOException {

        return captureService.create(image, name)
                .thenApply(response ->
                        ResponseEntity.status(HttpStatus.CREATED).build()
                );
    }


}

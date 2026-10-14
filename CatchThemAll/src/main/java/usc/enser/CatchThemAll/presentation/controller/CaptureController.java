package usc.enser.CatchThemAll.presentation.controller;

import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executor;

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
                                                                      @RequestPart("data") CaptureCreateRequest request,
                                                                      Principal principal) throws IOException {
        return Futures.transform(
            captureService.identify(currentUserId(principal), image, request),
            ResponseEntity::ok,
            executor
        );
    }

    @GetMapping
    public List<CaptureResponse> findMine(Principal principal) {
        return captureService.findMine(currentUserId(principal));
    }

    @GetMapping("/{captureId}")
    public CaptureResponse findMineById(@PathVariable UUID captureId, Principal principal) {
        return captureService.findMineById(currentUserId(principal), captureId);
    }

    private UUID currentUserId(Principal principal) {
        return UUID.fromString(principal.getName());
    }

}

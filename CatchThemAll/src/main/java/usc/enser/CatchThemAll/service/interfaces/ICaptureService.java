package usc.enser.CatchThemAll.service.interfaces;

import java.util.List;
import java.util.UUID;

import com.example.grpc.CaptureCreationResponse;
import org.springframework.web.multipart.MultipartFile;

import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;

public interface ICaptureService {

    CompletableFuture<CaptureResponse> identify (UUID userId, MultipartFile image, String name) throws IOException;

    CompletableFuture<CaptureCreationResponse> create (MultipartFile image, String name) throws IOException;

    List<CaptureResponse> findMine(UUID userId);

    CaptureResponse findMineById(UUID userId, UUID captureId);

}

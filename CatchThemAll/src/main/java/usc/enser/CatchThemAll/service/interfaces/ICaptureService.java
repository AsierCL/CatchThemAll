package usc.enser.CatchThemAll.service.interfaces;

import java.util.List;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import usc.enser.CatchThemAll.presentation.dto.CaptureCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;
import com.google.common.util.concurrent.ListenableFuture;
import java.io.IOException;

public interface ICaptureService {

    ListenableFuture<CaptureResponse> identify(UUID userId, MultipartFile image, CaptureCreateRequest request) throws IOException;

    List<CaptureResponse> findMine(UUID userId);

    CaptureResponse findMineById(UUID userId, UUID captureId);

}

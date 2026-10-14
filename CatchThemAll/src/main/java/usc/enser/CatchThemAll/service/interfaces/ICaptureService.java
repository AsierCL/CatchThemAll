package usc.enser.CatchThemAll.service.interfaces;

import java.util.List;
import java.util.UUID;

import com.example.grpc.CaptureCreationResponse;
import org.springframework.web.multipart.MultipartFile;

import usc.enser.CatchThemAll.presentation.dto.CaptureCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.CaptureCreateResponse;
import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;
import com.google.common.util.concurrent.ListenableFuture;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;

public interface ICaptureService {

    CompletableFuture<CaptureResponse> identify (MultipartFile image, CaptureCreateRequest request) throws IOException;

    CompletableFuture<CaptureCreationResponse> create (MultipartFile image, CaptureCreateRequest request) throws IOException;
    //List<CaptureResponse> findAll();

    //CaptureResponse findById();

    //void delete (UUID id);

}

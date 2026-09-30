package usc.enser.CatchThemAll.presentation.dto;

import org.springframework.web.multipart.MultipartFile;

public record CaptureCreateRequest(
    String name,
    MultipartFile image
) {

}

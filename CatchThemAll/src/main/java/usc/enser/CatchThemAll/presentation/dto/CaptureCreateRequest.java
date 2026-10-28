package usc.enser.CatchThemAll.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CaptureCreateRequest(
        @NotNull
        @NotBlank
        String name
) {
}

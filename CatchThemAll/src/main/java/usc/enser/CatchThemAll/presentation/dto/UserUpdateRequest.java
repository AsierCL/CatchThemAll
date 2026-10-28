package usc.enser.CatchThemAll.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @Size(max = 64)
        @NotNull
        @NotBlank
        String name,

        @Size(max = 255)
        @NotNull
        String description,

        @Size(max = 512)
        @NotNull
        String photoUrl
) {
}

package usc.enser.CatchThemAll.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserLogin(
        @NotNull
        @NotBlank
        @Size(max = 64)
        String name,

        @NotNull
        @NotBlank
        @Size(min = 8, max = 72)
        String password
) {
}

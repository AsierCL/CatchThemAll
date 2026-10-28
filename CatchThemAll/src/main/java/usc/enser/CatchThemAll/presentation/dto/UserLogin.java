package usc.enser.CatchThemAll.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserLogin(
        @NotNull
        @NotBlank
        String name,

        @NotNull
        @NotBlank
        String password
) {
}

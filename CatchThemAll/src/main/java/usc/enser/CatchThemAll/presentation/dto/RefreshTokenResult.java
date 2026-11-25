package usc.enser.CatchThemAll.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import usc.enser.CatchThemAll.persistence.entities.RefreshToken;

public record RefreshTokenResult(
        @NotNull
        RefreshToken refreshToken,

        @NotBlank
        @NotNull
        String rawToken
) {}

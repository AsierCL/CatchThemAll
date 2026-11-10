package usc.enser.CatchThemAll.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(
        name = "RefreshRequest",
        description = """
                Cuerpo para renovar el par de tokens. El `refreshToken` se obtiene junto al token de
                acceso en `POST /auth/login`, `POST /auth/register` o en la respuesta de esta misma
                operacion.""")
public record RefreshRequest(

        @Schema(
                description = """
                        Refresh token vigente. Se rota en cada llamada: el enviado queda invalido y la
                        respuesta trae uno nuevo.""",
                example = "2b1f9c4e-7d3a-4c58-9a61-0e2d4b8c1f73",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull
        @NotBlank
        String refreshToken
) {
}

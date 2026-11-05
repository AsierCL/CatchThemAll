package usc.enser.CatchThemAll.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "TokenResponse", description = "Token JWT emitido al registrarse o al iniciar sesion.")
public record TokenResponse(

        @Schema(
                description = "Token JWT firmado con HS256. Incluye `sub` (identificador del usuario), `name`, emisor y vencimiento.",
                example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YTFiMmMzZC00ZTVmIn0.signature")
        String token,

        @Schema(description = "Esquema de autorizacion que debe usarse en el header `Authorization`.", example = "Bearer")
        String tokenType,

        String refreshToken,

        @Schema(description = "Vigencia del token en segundos.", example = "900")
        long expiresIn
) {
}

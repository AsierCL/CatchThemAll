package usc.enser.CatchThemAll.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
        name = "TokenResponse",
        description = """
                Par de tokens emitido al registrarse, al iniciar sesion o al renovarlo. El token de
                acceso viaja en el header `Authorization`; el refresh token solo se usa en
                `POST /auth/refresh`.""")
public record TokenResponse(

        @Schema(
                description = "Token JWT firmado con HS256. Incluye `sub` (identificador del usuario), `name`, emisor y vencimiento.",
                example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4YTFiMmMzZC00ZTVmIn0.signature")
        String token,

        @Schema(description = "Esquema de autorizacion que debe usarse en el header `Authorization`.", example = "Bearer")
        String tokenType,

        @Schema(
                description = """
                        Token opaco para renovar el par sin volver a enviar credenciales. Se canjea en
                        `POST /auth/refresh`, que lo rota: el anterior deja de ser valido.""",
                example = "2b1f9c4e-7d3a-4c58-9a61-0e2d4b8c1f73")
        String refreshToken,

        @Schema(description = "Vigencia del token de acceso en segundos. El refresh token dura 24 horas.", example = "900")
        long expiresIn
) {
}

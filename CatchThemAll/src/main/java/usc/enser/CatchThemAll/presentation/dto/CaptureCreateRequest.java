package usc.enser.CatchThemAll.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(name = "CaptureCreateRequest", description = "Parte `data` de las peticiones multipart de capturas.")
public record CaptureCreateRequest(

        @Schema(
                description = "Nombre exacto del famoso tal como figura en el catalogo (`GET /famous`).",
                example = "Ada Lovelace",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull
        @NotBlank
        String name
) {
}

package usc.enser.CatchThemAll.presentation.dto;

import java.time.Instant;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
        name = "ErrorDTO",
        description = "Cuerpo unico de error. Lo emite `GlobalExceptionHandler` y tambien los handlers de seguridad.")
public record ErrorDTO(

        @Schema(description = "Momento en que se genero el error.", example = "2026-01-01T10:00:00.000Z")
        Instant timestamp,

        @Schema(description = "Codigo HTTP.", example = "404")
        int status,

        @Schema(description = "Frase estandar del codigo HTTP.", example = "Not Found")
        String error,

        @Schema(description = "Mensaje legible de la causa.", example = "famous not found")
        String message,

        @Schema(description = "Ruta solicitada.", example = "/famous/8a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d")
        String path,

        @Schema(
                description = """
                        Detalle por campo cuando la causa es una validacion (`campo: mensaje`).
                        Vacio en el resto de los casos.""",
                example = "[\"name: must not be blank\"]")
        List<String> details
) {
}

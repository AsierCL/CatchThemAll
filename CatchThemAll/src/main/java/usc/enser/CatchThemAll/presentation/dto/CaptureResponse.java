package usc.enser.CatchThemAll.presentation.dto;

import java.sql.Timestamp;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "CaptureResponse", description = "Resultado de una identificacion y datos de una captura del historial.")
public record CaptureResponse(

        @Schema(
                description = "Identificador de la captura persistida.",
                example = "3f5c1c1e-6a7b-4d8e-9f10-2b3c4d5e6f70")
        UUID captureId,

        @Schema(
                description = "Identificador del famoso identificado.",
                example = "8a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d")
        UUID famousId,

        @Schema(description = "Nombre del famoso.", example = "Ada Lovelace")
        String famousName,

        @Schema(
                description = "Similitud coseno entre el rostro de la foto y las muestras del famoso, de 0 a 1.",
                example = "0.93")
        double similarity,

        @Schema(
                description = """
                        Indica si el usuario ya tenia registrada esta captura **antes** de la peticion
                        actual. La primera captura de un famoso devuelve `false`.
                        Ver `TODO.md` en la raiz del repositorio.""",
                example = "false")
        boolean captured,

        @Schema(
                description = "Momento en que se registro la captura.",
                example = "2026-01-01T10:00:00.000+00:00")
        Timestamp timestamp
) {
}

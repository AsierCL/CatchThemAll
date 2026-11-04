package usc.enser.CatchThemAll.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Portador interno de los campos de texto que acompanan a la imagen. No forma parte del contrato
 * HTTP: en las peticiones multipart el campo viaja como un parte simple llamado {@code name}.
 */
public record CaptureCreateRequest(

        @NotNull
        @NotBlank
        String name
) {
}

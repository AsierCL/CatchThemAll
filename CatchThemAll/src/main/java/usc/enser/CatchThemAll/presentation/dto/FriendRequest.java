package usc.enser.CatchThemAll.presentation.dto;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(name = "FriendRequest", description = "Cuerpo para agregar una amistad.")
public record FriendRequest(

        @Schema(
                description = "Identificador del usuario que se quiere agregar como amigo.",
                example = "3f5c1c1e-6a7b-4d8e-9f10-2b3c4d5e6f70",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull
        @NotBlank
        UUID friendId
) {
}

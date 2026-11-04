package usc.enser.CatchThemAll.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(
        name = "UserUpdateRequest",
        description = """
                Cuerpo de actualizacion de perfil. Los tres campos son obligatorios: la operacion
                reemplaza el perfil completo, tanto en `PUT` como en `PATCH`.
                Ver `TODO.md` en la raiz del repositorio.""")
public record UserUpdateRequest(

        @Schema(
                description = "Nuevo nombre de usuario (unico, hasta 64 caracteres). Se guarda sin espacios en los extremos.",
                example = "ada",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @Size(max = 64)
        @NotNull
        @NotBlank
        String name,

        @Schema(
                description = "Nueva descripcion del perfil (puede ser vacia, hasta 255 caracteres).",
                example = "Cazadora de famosos del siglo XIX",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @Size(max = 255)
        @NotNull
        String description,

        @Schema(
                description = "Nueva URL de la foto de perfil (puede ser vacia, hasta 512 caracteres).",
                example = "https://cdn.example.com/users/ada.jpg",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @Size(max = 512)
        @NotNull
        String photoUrl
) {
}

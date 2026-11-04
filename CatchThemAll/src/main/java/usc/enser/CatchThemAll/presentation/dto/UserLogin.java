package usc.enser.CatchThemAll.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(name = "UserLogin", description = "Credenciales para iniciar sesion.")
public record UserLogin(

        @Schema(
                description = "Nombre de usuario registrado (unico, hasta 64 caracteres).",
                example = "ada",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull
        @NotBlank
        @Size(max = 64)
        String name,

        @Schema(
                description = "Contrasena en texto plano (entre 8 y 72 caracteres).",
                example = "contrasena-segura",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull
        @NotBlank
        @Size(min = 8, max = 72)
        String password
) {
}

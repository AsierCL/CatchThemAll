package usc.enser.CatchThemAll.presentation.dto;

import java.time.LocalDate;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

@Schema(name = "UserRegister", description = "Datos para crear una cuenta.")
public record UserRegister(

        @Schema(
                description = "Nombre de usuario (unico, hasta 64 caracteres). Se guarda sin espacios en los extremos.",
                example = "ada",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull
        @NotBlank
        @Size(max = 64)
        String name,

        @Schema(
                description = "Contrasena en texto plano (entre 8 y 72 caracteres). Se persiste como hash BCrypt.",
                example = "contrasena-segura",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull
        @NotBlank
        @Size(min = 8, max = 72)
        String password,

        @Schema(
                description = "Email (unico, hasta 255 caracteres). Se guarda en minusculas.",
                example = "ada@example.com",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @Email
        @NotNull
        @NotBlank
        @Size(max = 255)
        String email,

        @Schema(
                description = "Fecha de nacimiento. No puede ser futura.",
                example = "1990-12-10",
                requiredMode = Schema.RequiredMode.REQUIRED)
        @NotNull
        @PastOrPresent
        LocalDate birthDate
) {
}

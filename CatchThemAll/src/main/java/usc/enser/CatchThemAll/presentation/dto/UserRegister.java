package usc.enser.CatchThemAll.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UserRegister(

        @NotNull
        @NotBlank
        @Size(max = 64)
        String name,

        @NotNull
        @NotBlank
        @Size(min = 8, max = 72)
        String password,

        @Email
        @NotNull
        @NotBlank
        @Size(max = 255)
        String email,

        @NotNull
        @PastOrPresent
        LocalDate birthDate
) {
}

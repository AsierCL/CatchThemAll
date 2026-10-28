package usc.enser.CatchThemAll.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

public record UserRegister(

        @NotNull
        @NotBlank
        String name,

        @NotNull
        @NotBlank
        String password,

        @Email
        @NotNull
        @NotBlank
        String email,

        @NotNull
        @PastOrPresent
        LocalDate birthDate
) {
}

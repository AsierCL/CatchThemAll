package usc.enser.CatchThemAll.presentation.dto;

public record TokenResponse(
        String token,
        String tokenType,
        long expiresIn
) {
}

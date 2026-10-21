package usc.enser.CatchThemAll.presentation.dto;

public record UserUpdateRequest(
        String name,
        String description,
        String photoUrl
) {
}

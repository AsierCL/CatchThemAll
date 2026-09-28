package usc.enser.CatchThemAll.presentation.dto;

public record UserCreateRequest(
        String name,
        String password,
        String description,
        String photoUrl
) {
}

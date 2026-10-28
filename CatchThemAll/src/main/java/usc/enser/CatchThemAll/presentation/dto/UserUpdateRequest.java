package usc.enser.CatchThemAll.presentation.dto;

import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @Size(max = 64)
        String name,

        @Size(max = 255)
        String description,

        @Size(max = 512)
        String photoUrl
) {
}

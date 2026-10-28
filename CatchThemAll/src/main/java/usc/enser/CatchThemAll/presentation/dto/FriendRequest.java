package usc.enser.CatchThemAll.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record FriendRequest(
        @NotNull
        @NotBlank
        UUID friendId
) {
}

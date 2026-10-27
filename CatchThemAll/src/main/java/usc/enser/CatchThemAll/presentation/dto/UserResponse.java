package usc.enser.CatchThemAll.presentation.dto;

import java.util.Set;
import java.util.UUID;

public record UserResponse(
        UUID userId,
        String name,
        int captureCount,
        Set<UUID> friendIds
) {
}

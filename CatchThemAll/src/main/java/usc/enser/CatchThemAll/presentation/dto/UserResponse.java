package usc.enser.CatchThemAll.presentation.dto;

import com.fasterxml.jackson.annotation.JsonView;

import java.util.Set;
import java.util.UUID;

public record UserResponse(
        @JsonView(Basic.class)
        UUID userId,

        @JsonView(Basic.class)
        String name,

        @JsonView(Full.class)
        String photoUrl,

        @JsonView(Basic.class)
        int score,

        @JsonView(Basic.class)
        int captureCount,

        @JsonView(Basic.class)
        Set<UUID> friendIds,

        @JsonView(Full.class)
        String description
) {
    public interface Basic {}
    public interface Full extends Basic {}
}

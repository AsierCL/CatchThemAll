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
        int score,

        @JsonView(Full.class)
        String description,

        @JsonView(Full.class)
        String photo_url,

        @JsonView(Basic.class)
        int captureCount,

        @JsonView(Basic.class)
        Set<UUID> friendIds
) {
    public interface Basic {}
    public interface Full extends Basic{}
}

package usc.enser.CatchThemAll.presentation.dto;

import java.time.Instant;
import java.util.List;

public record ErrorDTO(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> details
) {
}

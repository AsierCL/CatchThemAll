package usc.enser.CatchThemAll.presentation.dto;

import java.sql.Timestamp;
import java.util.UUID;

public record CaptureResponse (
    UUID captureId,
    UUID famousId,
    String famousName,
    double similarity,
    boolean captured,
    Timestamp timestamp
) {
}

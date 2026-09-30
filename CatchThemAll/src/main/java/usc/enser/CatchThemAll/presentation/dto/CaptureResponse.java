package usc.enser.CatchThemAll.presentation.dto;

import jdk.jfr.Timestamp;

public record CaptureResponse (

    UUID captureId,
    String username,
    String famous,
    Timestamp timestamp,
    String photoUrl
    //Ubicacion
) {
}

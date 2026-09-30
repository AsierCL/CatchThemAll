package usc.enser.CatchThemAll.service.interfaces;

import java.util.UUID;

import usc.enser.CatchThemAll.presentation.dto.CaptureCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;

public interface ICaptureService {

    CaptureResponse identify (CaptureCreateRequest request);

    List<CaptureResponse> findAll();

    CaptureResponse findById();

    void delete (UUID id);

}

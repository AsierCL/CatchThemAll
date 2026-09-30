package usc.enser.CatchThemAll.service.interfaces;

import java.util.List;
import java.util.UUID;

import usc.enser.CatchThemAll.enums.FamousTypes;
import usc.enser.CatchThemAll.persistence.entities.Famous;
import usc.enser.CatchThemAll.presentation.dto.FamousResponse;

public interface IFamousService {

    List<Famous> findAll();

    List<Famous> findByType(FamousTypes type);

    FamousResponse findById(UUID famousId);

}

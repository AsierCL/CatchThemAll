package usc.enser.CatchThemAll.service.interfaces;

import java.util.List;
import java.util.UUID;

import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;
import usc.enser.CatchThemAll.presentation.dto.FamousResponse;

public interface IFamousService {

    List<FamousResponse> findAll(FamousTypes type, FamousCategories category);

    //List<FamousResponse> findByType(FamousTypes type);

    FamousResponse findById(UUID famousId);

}

package usc.enser.CatchThemAll.service.interfaces;

import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;
import usc.enser.CatchThemAll.persintence.entities.Famous;

public interface IFamousService {

    List<Famous> findAll();

    List<Famous> findByType(FamousTypes type);

    FamousResponse findById(UUID famousId);

}

package usc.enser.CatchThemAll.persintence.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;
import usc.enser.CatchThemAll.persintence.entities.Famous;


public interface FamousRepository extends JpaRepository<Famous, Long>{

    List<Famous> findByType(FamousTypes type);

    List<Famous> findByCategory(FamousCategories category);

}

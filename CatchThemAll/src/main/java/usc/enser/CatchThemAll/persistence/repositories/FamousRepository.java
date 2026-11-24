package usc.enser.CatchThemAll.persistence.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;
import usc.enser.CatchThemAll.persistence.entities.Famous;


public interface FamousRepository extends JpaRepository<Famous, UUID>{

    Optional<Famous> findByName(String name);

    Page<Famous> findAllByOrderByPokedexNumberAsc(Pageable pageable);

    Page<Famous> findByTypeAndCategoryOrderByPokedexNumberAsc(FamousTypes type, FamousCategories category, Pageable pageable);

    List<Famous> findByType(FamousTypes type);

    Page<Famous> findByTypeOrderByPokedexNumberAsc(FamousTypes type, Pageable pageable);

    List<Famous> findByCategory(FamousCategories category);

    Page<Famous> findByCategoryOrderByPokedexNumberAsc(FamousCategories category, Pageable pageable);

}

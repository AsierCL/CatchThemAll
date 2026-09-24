package usc.enser.CatchThemAll.persintence.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import usc.enser.CatchThemAll.persintence.entities.Captures;
import usc.enser.CatchThemAll.persintence.entities.Famous;

public interface CapturesRepository extends JpaRepository<Captures, Long>{

    List<Captures> findByFamous(Famous famous);

}

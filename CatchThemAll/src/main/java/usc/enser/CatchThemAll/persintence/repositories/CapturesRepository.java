package usc.enser.CatchThemAll.persintence.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import usc.enser.CatchThemAll.persintence.entities.Captures;
import usc.enser.CatchThemAll.persintence.entities.Famous;

public interface CapturesRepository extends JpaRepository<Captures, UUID>{

    List<Captures> findByFamous(Famous famous);

}

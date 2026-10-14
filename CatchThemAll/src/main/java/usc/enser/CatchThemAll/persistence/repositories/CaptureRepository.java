package usc.enser.CatchThemAll.persistence.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import usc.enser.CatchThemAll.persistence.entities.Captures;
import usc.enser.CatchThemAll.persistence.entities.Famous;
import usc.enser.CatchThemAll.persistence.entities.User;

public interface CaptureRepository extends JpaRepository<Captures, UUID>{

    List<Captures> findByFamous(Famous famous);

    List<Captures> findAllByUserOrderByTimestampDesc(User user);

    Optional<Captures> findByCaptureIdAndUser(UUID captureId, User user);

}

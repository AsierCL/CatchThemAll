package usc.enser.CatchThemAll.persintence.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import usc.enser.CatchThemAll.persintence.entities.User;

public interface UserRepository extends JpaRepository<User, UUID>{

    User findByName(String name);

    User findByUserId(UUID userId);

    boolean existsByName(String name);

    List<User> findAllByOrderByScoreDesc();

}

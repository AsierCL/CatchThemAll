package usc.enser.CatchThemAll.persintence.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import usc.enser.CatchThemAll.persintence.entities.User;

public interface UserRepository extends JpaRepository<User, Long>{

    User findByName(String name);

    User findByUserId(UUID userId);

}

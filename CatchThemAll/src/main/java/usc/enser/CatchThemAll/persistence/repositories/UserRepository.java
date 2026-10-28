package usc.enser.CatchThemAll.persistence.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import usc.enser.CatchThemAll.persistence.entities.User;

public interface UserRepository extends JpaRepository<User, UUID>{

    Optional<User> findByName(String name);

    User findByUserId(UUID userId);

    boolean existsByName(String name);

    boolean existsByEmail(String email);

    boolean existsByNameAndUserIdNot(String name, UUID userId);

    List<User> findAllByNameContainingIgnoreCaseOrderByNameAsc(String name);

    @Query("""
            SELECT u
            FROM User u
            ORDER BY COALESCE(u.score, 0) DESC, u.name ASC
            """)
    List<User> findRanking();

}

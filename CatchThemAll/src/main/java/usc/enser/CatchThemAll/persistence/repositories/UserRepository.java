package usc.enser.CatchThemAll.persistence.repositories;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;
import usc.enser.CatchThemAll.persistence.entities.User;

public interface UserRepository extends JpaRepository<User, UUID>{

    Optional<User> findByName(String name);

    Optional<User> findByUserId(UUID userId);

    boolean existsByName(String name);

    boolean existsByEmail(String email);

    boolean existsByNameAndUserIdNot(String name, UUID userId);

    Page<User> findAllByNameContainingIgnoreCaseOrderByNameAsc(String name, Pageable pageable);

    @Query("""
            SELECT u
            FROM User u
            ORDER BY COALESCE(u.score, 0) DESC, u.name ASC
            """)
    Page<User> findRanking(Pageable pageable);

    @Modifying
    @Query("""
           UPDATE User u
           SET u.score = COALESCE(u.score, 0) + :points
           WHERE u.userId = :uuid
           """)
    int updateScore (@Param("uuid") UUID id, @Param("points") int points);

    @Query("""
    SELECT f.userId
    FROM User u
    JOIN u.friends f
    WHERE u.userId = :userId
    """)
    Set<UUID> findFriendIds(UUID userId);

    @Query("""
    SELECT COUNT(c)
    FROM Captures c
    WHERE c.user.userId = :userId
    """)
    long countCapturesByUserId(UUID userId);
}

package usc.enser.CatchThemAll.persistence.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import usc.enser.CatchThemAll.persistence.entities.RefreshToken;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByToken(String token);

    void deleteByUser_UserId(UUID id);
}

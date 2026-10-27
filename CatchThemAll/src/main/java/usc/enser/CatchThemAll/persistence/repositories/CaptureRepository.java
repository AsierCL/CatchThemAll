package usc.enser.CatchThemAll.persistence.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import usc.enser.CatchThemAll.persistence.entities.Captures;
import usc.enser.CatchThemAll.persistence.entities.Famous;
import usc.enser.CatchThemAll.persistence.entities.User;

public interface CaptureRepository extends JpaRepository<Captures, UUID>{

    List<Captures> findByFamous(Famous famous);

    @Query("""
            SELECT c.famous.famousId AS famousId,
                   COUNT(c) AS captureCount,
                   COUNT(DISTINCT c.user.userId) AS collectorCount
            FROM Captures c
            GROUP BY c.famous.famousId
            """)
    List<FamousCaptureStatistics> findCaptureStatisticsForAll();

    @Query("""
            SELECT c.famous.famousId AS famousId,
                   COUNT(c) AS captureCount,
                   COUNT(DISTINCT c.user.userId) AS collectorCount
            FROM Captures c
            WHERE c.famous.famousId = :famousId
            GROUP BY c.famous.famousId
            """)
    java.util.Optional<FamousCaptureStatistics> findCaptureStatisticsByFamousId(@Param("famousId") UUID famousId);

    List<Captures> findAllByUserOrderByTimestampDesc(User user);

    Optional<Captures> findByCaptureIdAndUser(UUID captureId, User user);

    @Query("""
        SELECT c
        FROM Captures c
        WHERE c.famous = :famous
          AND c.user = :user
    """)
    Optional<Captures> findByCaptureFamousAndUser(Famous famous, User user);

}

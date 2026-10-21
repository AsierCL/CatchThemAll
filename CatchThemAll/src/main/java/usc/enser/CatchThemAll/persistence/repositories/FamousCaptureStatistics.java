package usc.enser.CatchThemAll.persistence.repositories;

import java.util.UUID;

public interface FamousCaptureStatistics {

    UUID getFamousId();

    Long getCaptureCount();

    Long getCollectorCount();

}

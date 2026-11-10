package usc.enser.CatchThemAll.service.interfaces;

import java.util.UUID;

public interface IScoreService {

    void updateScore(String name, double similarity, UUID id);

}

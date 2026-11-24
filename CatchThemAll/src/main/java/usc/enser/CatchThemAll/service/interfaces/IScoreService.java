package usc.enser.CatchThemAll.service.interfaces;

import usc.enser.CatchThemAll.persistence.entities.Captures;

import java.util.UUID;

public interface IScoreService {

    void finishFuture(String name, double similarity, UUID id, Captures capture);

}

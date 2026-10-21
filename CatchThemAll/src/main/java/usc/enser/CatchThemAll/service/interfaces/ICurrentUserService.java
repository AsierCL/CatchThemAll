package usc.enser.CatchThemAll.service.interfaces;

import java.util.UUID;

import usc.enser.CatchThemAll.persistence.entities.User;

public interface ICurrentUserService {

    UUID getCurrentUserId();

    User getCurrentUser();
}

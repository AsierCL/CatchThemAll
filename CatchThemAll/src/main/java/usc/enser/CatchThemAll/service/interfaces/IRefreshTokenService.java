package usc.enser.CatchThemAll.service.interfaces;

import usc.enser.CatchThemAll.persistence.entities.RefreshToken;

import java.util.UUID;

public interface IRefreshTokenService {

    RefreshToken create(UUID id);

    boolean isExpired(RefreshToken token);

}

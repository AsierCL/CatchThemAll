package usc.enser.CatchThemAll.service.interfaces;

import usc.enser.CatchThemAll.persistence.entities.RefreshToken;

import java.util.UUID;

public interface IRefreshTokenService {

    public RefreshToken create(UUID id);

    public boolean isExpired(RefreshToken token);

}

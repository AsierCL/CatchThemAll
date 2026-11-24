package usc.enser.CatchThemAll.service.interfaces;

import usc.enser.CatchThemAll.persistence.entities.RefreshToken;
import usc.enser.CatchThemAll.presentation.dto.RefreshTokenResult;

import java.util.UUID;

public interface IRefreshTokenService {

    RefreshTokenResult create(UUID id);

    String hashToken(String token);

    boolean isExpired(RefreshToken token);
}

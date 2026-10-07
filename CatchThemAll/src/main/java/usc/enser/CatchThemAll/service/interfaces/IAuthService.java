package usc.enser.CatchThemAll.service.interfaces;

import usc.enser.CatchThemAll.presentation.dto.TokenResponse;
import usc.enser.CatchThemAll.presentation.dto.UserLogin;

public interface IAuthService {

    TokenResponse login(UserLogin request);
}

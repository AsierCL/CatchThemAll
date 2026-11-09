package usc.enser.CatchThemAll.service.interfaces;

import usc.enser.CatchThemAll.presentation.dto.RefreshRequest;
import usc.enser.CatchThemAll.presentation.dto.TokenResponse;
import usc.enser.CatchThemAll.presentation.dto.UserLogin;
import usc.enser.CatchThemAll.presentation.dto.UserRegister;

public interface IAuthService {

    TokenResponse login(UserLogin request);

    TokenResponse register(UserRegister request);

    TokenResponse refresh(RefreshRequest request);
}

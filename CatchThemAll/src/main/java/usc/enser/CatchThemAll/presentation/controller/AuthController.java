package usc.enser.CatchThemAll.presentation.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import usc.enser.CatchThemAll.presentation.dto.TokenResponse;
import usc.enser.CatchThemAll.presentation.dto.UserLogin;
import usc.enser.CatchThemAll.presentation.dto.UserRegister;
import usc.enser.CatchThemAll.service.interfaces.IAuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final IAuthService authService;

    public AuthController(IAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public TokenResponse login(@RequestBody @Valid UserLogin request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    public TokenResponse register(@RequestBody @Valid UserRegister request){ return authService.register(request); }
}

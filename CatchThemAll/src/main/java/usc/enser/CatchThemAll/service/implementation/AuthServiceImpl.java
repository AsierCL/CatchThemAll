package usc.enser.CatchThemAll.service.implementation;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import usc.enser.CatchThemAll.exception.ApiException;
import usc.enser.CatchThemAll.persistence.entities.RefreshToken;
import usc.enser.CatchThemAll.persistence.entities.User;
import usc.enser.CatchThemAll.persistence.repositories.RefreshTokenRepository;
import usc.enser.CatchThemAll.persistence.repositories.UserRepository;
import usc.enser.CatchThemAll.presentation.dto.RefreshRequest;
import usc.enser.CatchThemAll.presentation.dto.TokenResponse;
import usc.enser.CatchThemAll.presentation.dto.UserLogin;
import usc.enser.CatchThemAll.presentation.dto.UserRegister;
import usc.enser.CatchThemAll.service.interfaces.IAuthService;

@Service
public class AuthServiceImpl implements IAuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtEncoder jwtEncoder;
    private final Duration tokenDuration;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           RefreshTokenService refreshTokenService,
                           JwtEncoder jwtEncoder,
                           @Value("${security.jwt.expiration-minutes}") long expirationMinutes, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenService = refreshTokenService;
        this.jwtEncoder = jwtEncoder;
        this.tokenDuration = Duration.ofMinutes(expirationMinutes);
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public TokenResponse login(UserLogin request) {

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.name(), request.password()));
        } catch (AuthenticationException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }

        User user = userRepository.findByName(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "invalid credentials"));

        RefreshToken refreshToken = refreshTokenService.create(user.getUserId());
        return generateToken(user, refreshToken.getToken());
    }

    @Override
    public TokenResponse register(UserRegister request){

        String name = request.name().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if(userRepository.existsByName(name)){
            throw new ApiException(HttpStatus.CONFLICT,"name already in use");
        }
        if(userRepository.existsByEmail(email)){
            throw new ApiException(HttpStatus.CONFLICT,"email already in use");
        }

        User user = new User();
        user.setName(name);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmail(email);
        user.setBirthDate(request.birthDate());

        User savedUser = userRepository.save(user);
        //Creamos el refreshToken
        RefreshToken refreshToken = refreshTokenService.create(savedUser.getUserId());
        return generateToken(savedUser,refreshToken.getToken());
    }

    public TokenResponse refresh(RefreshRequest request) {

        String requestToken = request.refreshToken();

        RefreshToken token = refreshTokenRepository
                .findByToken(requestToken)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Refresh token not found"
                ));

        if (refreshTokenService.isExpired(token)) {
            refreshTokenRepository.delete(token);

            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "Refresh token expired. Please login again."
            );
        }

        refreshTokenRepository.delete(token);

        RefreshToken newRefreshToken = refreshTokenService.create(token.getUser().getUserId());

        return generateToken(token.getUser(), newRefreshToken.getToken());
    }

    private TokenResponse generateToken(User user, String refreshToken){
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("CatchThemAll")
                .subject(user.getUserId().toString())
                .claim("name", user.getName())
                .issuedAt(now)
                .expiresAt(now.plus(tokenDuration))
                .build();
        String token = jwtEncoder.encode(
                JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();

        return new TokenResponse(token,"Bearer", refreshToken,tokenDuration.toSeconds());
    }
}

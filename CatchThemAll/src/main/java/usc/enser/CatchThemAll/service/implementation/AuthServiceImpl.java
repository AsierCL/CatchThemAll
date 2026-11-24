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
import org.springframework.transaction.annotation.Transactional;

import usc.enser.CatchThemAll.exception.ApiException;
import usc.enser.CatchThemAll.persistence.entities.RefreshToken;
import usc.enser.CatchThemAll.persistence.entities.User;
import usc.enser.CatchThemAll.persistence.repositories.RefreshTokenRepository;
import usc.enser.CatchThemAll.persistence.repositories.UserRepository;
import usc.enser.CatchThemAll.presentation.dto.*;
import usc.enser.CatchThemAll.service.interfaces.IAuthService;
import usc.enser.CatchThemAll.service.interfaces.IRefreshTokenService;

@Service
public class AuthServiceImpl implements IAuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final IRefreshTokenService refreshTokenService;
    private final JwtEncoder jwtEncoder;
    private final Duration tokenDuration;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           IRefreshTokenService refreshTokenService,
                           JwtEncoder jwtEncoder,
                           @Value("${security.jwt.expiration-minutes:15}") long expirationMinutes, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenService = refreshTokenService;
        this.jwtEncoder = jwtEncoder;
        this.tokenDuration = Duration.ofMinutes(expirationMinutes);
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(noRollbackFor = ApiException.class)
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

        refreshTokenRepository.deleteByUser_UserId(user.getUserId());
        refreshTokenRepository.flush();

        RefreshTokenResult result = refreshTokenService.create(user.getUserId());
        String refreshToken = result.rawToken();
        return generateToken(user, refreshToken);
    }

    @Override
    @Transactional(noRollbackFor = ApiException.class)
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
        RefreshTokenResult result = refreshTokenService.create(savedUser.getUserId());
        String refreshToken = result.rawToken();
        return generateToken(savedUser,refreshToken);
    }

    @Override
    @Transactional(noRollbackFor = ApiException.class)
    public TokenResponse refresh(RefreshRequest request) {

        // El cliente envía el token original
        String requestToken = request.refreshToken();

        // Buscamos utilizando su hash
        String hashedToken = refreshTokenService.hashToken(requestToken);

        RefreshToken token = refreshTokenRepository
                .findByToken(hashedToken)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid refresh token"
                ));

        if (refreshTokenService.isExpired(token)) {
            refreshTokenRepository.delete(token);
            refreshTokenRepository.flush();

            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "Refresh token expired. Please login again."
            );
        }

        // Guardamos el usuario antes de eliminar el token
        User user = token.getUser();

        // Rotación del refresh token
        refreshTokenRepository.delete(token);
        refreshTokenRepository.flush();

        RefreshTokenResult result =
                refreshTokenService.create(user.getUserId());

        // Devolvemos el token original, no el hash
        return generateToken(user, result.rawToken());
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

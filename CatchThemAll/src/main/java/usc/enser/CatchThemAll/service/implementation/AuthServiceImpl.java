package usc.enser.CatchThemAll.service.implementation;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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
import usc.enser.CatchThemAll.persistence.entities.User;
import usc.enser.CatchThemAll.persistence.repositories.UserRepository;
import usc.enser.CatchThemAll.presentation.dto.TokenResponse;
import usc.enser.CatchThemAll.presentation.dto.UserLogin;
import usc.enser.CatchThemAll.presentation.dto.UserRegister;
import usc.enser.CatchThemAll.service.interfaces.IAuthService;

@Service
public class AuthServiceImpl implements IAuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtEncoder jwtEncoder;
    private final Duration tokenDuration;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           JwtEncoder jwtEncoder,
                           @Value("${security.jwt.expiration-minutes}") long expirationMinutes, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
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

        User user = userRepository.findByName(authentication.getName());

        return generateToken(user);
    }

    @Override
    public TokenResponse register(UserRegister request){

        if(userRepository.existsByName(request.name())){
            throw new ApiException(HttpStatus.CONFLICT,"name already in use");
        }

        User user = new User();
        user.setName(request.name());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmail(request.email());
        user.setBirthDate(request.birthDate());

        User savedUser = userRepository.save(user);
        return generateToken(savedUser);
    }

    private TokenResponse generateToken(User user){
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

        return new TokenResponse(token,"Bearer", tokenDuration.toSeconds());
    }
}

package usc.enser.CatchThemAll.service.implementation;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import usc.enser.CatchThemAll.persistence.entities.RefreshToken;
import usc.enser.CatchThemAll.persistence.entities.User;
import usc.enser.CatchThemAll.persistence.repositories.RefreshTokenRepository;
import usc.enser.CatchThemAll.persistence.repositories.UserRepository;
import usc.enser.CatchThemAll.service.interfaces.IRefreshTokenService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class RefreshTokenService implements IRefreshTokenService {
    @Value("${jwt.refreshExpirationMs:86400000}")
    private Long refreshTokenDuration;
    private final JwtEncoder jwtEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenService(JwtEncoder jwtEncoder, RefreshTokenRepository refreshTokenRepository, UserRepository userRepository){
        this.jwtEncoder = jwtEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    @Override
    public RefreshToken create(UUID id) {

        User user = userRepository.findByUserId(id);

        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("CatchThemAll")
                .subject(user.getUserId().toString())
                .claim("type", "refresh")
                .issuedAt(now)
                .expiresAt(now.plusMillis(refreshTokenDuration))
                .build();
        String rawtoken = jwtEncoder.encode(
                JwtEncoderParameters.from(
                        JwsHeader.with(MacAlgorithm.HS256).build(),
                        claims
                )
        ).getTokenValue();
        var token = new RefreshToken();
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusMillis(refreshTokenDuration));
        token.setToken(hashToken(rawtoken));
        return refreshTokenRepository.save(token);
    }

    private String hashToken(String token){
        try{
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        }catch (NoSuchAlgorithmException e){
            throw new IllegalStateException("No se pudo completar la creación del refresh token.");
        }
    }

    @Override
    public boolean isExpired(RefreshToken token) {
        return token.getExpiresAt().isBefore(Instant.now());
    }

}

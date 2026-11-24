
package usc.enser.CatchThemAll.service.implementation;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import usc.enser.CatchThemAll.persistence.entities.RefreshToken;
import usc.enser.CatchThemAll.persistence.entities.User;
import usc.enser.CatchThemAll.persistence.repositories.RefreshTokenRepository;
import usc.enser.CatchThemAll.persistence.repositories.UserRepository;
import usc.enser.CatchThemAll.presentation.dto.RefreshTokenResult;
import usc.enser.CatchThemAll.service.interfaces.IRefreshTokenService;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class RefreshTokenServiceImpl implements IRefreshTokenService {

    @Value("${jwt.refreshExpirationMs:86400000}")
    private Long refreshTokenDuration;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenServiceImpl(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    @Override
    public RefreshTokenResult create(UUID id) {

        User user = userRepository.findByUserId(id)
                .orElseThrow(EntityNotFoundException::new);

        // Generar 256 bits aleatorios
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);

        // Token opaco que recibirá el cliente
        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusMillis(refreshTokenDuration));

        // Almacenar únicamente el hash
        token.setToken(hashToken(rawToken));

        refreshTokenRepository.save(token);

        // Devolver el token original al cliente
        return new RefreshTokenResult(token, rawToken);
    }

    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(
                    token.getBytes(java.nio.charset.StandardCharsets.UTF_8)
            );
            return HexFormat.of().formatHex(hash);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("No se pudo generar el hash del refresh token.", e);
        }
    }

    public boolean isExpired(RefreshToken token) {
        return !token.getExpiresAt().isAfter(Instant.now());
    }
}

package usc.enser.CatchThemAll.service.implementation;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import usc.enser.CatchThemAll.exception.ApiException;
import usc.enser.CatchThemAll.persistence.entities.User;
import usc.enser.CatchThemAll.persistence.repositories.UserRepository;
import usc.enser.CatchThemAll.service.interfaces.ICurrentUserService;

@Service
public class CurrentUserServiceImpl implements ICurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "authentication required");
        }

        String subject = authentication.getName();
        if (subject == null || subject.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid authenticated user id");
        }
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid authenticated user id");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public User getCurrentUser() {
        UUID userId = getCurrentUserId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user not found"));
    }
}

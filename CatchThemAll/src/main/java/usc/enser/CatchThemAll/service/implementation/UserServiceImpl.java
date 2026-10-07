package usc.enser.CatchThemAll.service.implementation;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import usc.enser.CatchThemAll.exception.ApiException;
import usc.enser.CatchThemAll.persistence.entities.User;
import usc.enser.CatchThemAll.persistence.repositories.UserRepository;
import usc.enser.CatchThemAll.presentation.dto.UserCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.UserResponse;
import usc.enser.CatchThemAll.presentation.dto.UserUpdateRequest;
import usc.enser.CatchThemAll.service.interfaces.IUserService;

@Service
public class UserServiceImpl implements IUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UserResponse create(UserCreateRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "name is required");
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "password is required");
        }
        if (userRepository.existsByName(request.name())) {
            throw new ApiException(HttpStatus.CONFLICT, "name already in use");
        }
        User user = new User();
        user.setName(request.name());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDescription(request.description());
        user.setPhoto_url(request.photoUrl());
        user.setScore(0);
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(UUID userId) {
        return toResponse(getOrThrow(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> ranking() {
        return userRepository.findAllByOrderByScoreDesc()
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public UserResponse update(UUID userId, UserUpdateRequest request) {
        User user = getOrThrow(userId);
        if (request.description() != null) {
            user.setDescription(request.description());
        }
        if (request.photoUrl() != null) {
            user.setPhoto_url(request.photoUrl());
        }
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void delete(UUID userId) {
        User user = getOrThrow(userId);
        for (User friend : user.getFriends()) {
            friend.getFriends().remove(user);
        }
        user.getFriends().clear();
        userRepository.delete(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> friends(UUID userId) {
        return getOrThrow(userId).getFriends().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public UserResponse addFriend(UUID userId, UUID friendId) {
        if (userId.equals(friendId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "cannot befriend yourself");
        }
        User user = getOrThrow(userId);
        User friend = getOrThrow(friendId);
        user.getFriends().add(friend);
        friend.getFriends().add(user);
        userRepository.save(friend);
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void removeFriend(UUID userId, UUID friendId) {
        User user = getOrThrow(userId);
        User friend = getOrThrow(friendId);
        if (!user.getFriends().contains(friend)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "friendship not found");
        }
        user.getFriends().remove(friend);
        friend.getFriends().remove(user);
        userRepository.save(friend);
        userRepository.save(user);
    }

    private User getOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user not found"));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getName(),
                user.getDescription(),
                user.getPhoto_url(),
                user.getScore(),
                user.getCaptures().size(),
                user.getFriends().stream().map(User::getUserId).collect(Collectors.toSet()));
    }
}

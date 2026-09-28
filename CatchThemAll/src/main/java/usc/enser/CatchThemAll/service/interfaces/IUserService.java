package usc.enser.CatchThemAll.service.interfaces;

import java.util.List;
import java.util.UUID;

import usc.enser.CatchThemAll.presentation.dto.UserCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.UserResponse;
import usc.enser.CatchThemAll.presentation.dto.UserUpdateRequest;

public interface IUserService {

    UserResponse create(UserCreateRequest request);

    List<UserResponse> findAll();

    UserResponse findById(UUID userId);

    List<UserResponse> ranking();

    UserResponse update(UUID userId, UserUpdateRequest request);

    void delete(UUID userId);

    List<UserResponse> friends(UUID userId);

    UserResponse addFriend(UUID userId, UUID friendId);

    void removeFriend(UUID userId, UUID friendId);
}

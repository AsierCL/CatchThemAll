package usc.enser.CatchThemAll.service.interfaces;

import java.util.List;
import java.util.UUID;

import usc.enser.CatchThemAll.presentation.dto.UserResponse;
import usc.enser.CatchThemAll.presentation.dto.UserUpdateRequest;

public interface IUserService {

    List<UserResponse> findAll();

    List<UserResponse> search(String name);

    UserResponse findById(UUID userId);

    List<UserResponse> ranking();

    UserResponse update(UUID userId, UserUpdateRequest request);

    void delete(UUID userId);

    List<UserResponse> friends(UUID userId);

    UserResponse getFriendProfile(UUID userId, UUID friendId);

    UserResponse addFriend(UUID userId, UUID friendId);

    void removeFriend(UUID userId, UUID friendId);
}

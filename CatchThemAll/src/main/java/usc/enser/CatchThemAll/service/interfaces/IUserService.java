package usc.enser.CatchThemAll.service.interfaces;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import tools.jackson.databind.JsonNode;
import usc.enser.CatchThemAll.presentation.dto.UserResponse;
import usc.enser.CatchThemAll.presentation.dto.UserPutUpdateRequest;

public interface IUserService {

    Page<UserResponse> findAll(Pageable pageable);

    Page<UserResponse> search(String name, Pageable pageable);

    UserResponse findById(UUID userId);

    Page<UserResponse> ranking(Pageable pageable);

    UserResponse putUpdate(UUID userId, UserPutUpdateRequest request);

    UserResponse patchUpdate(UUID userId, JsonNode request);

    void delete(UUID userId);

    List<UserResponse> friends(UUID userId);

    UserResponse getFriendProfile(UUID userId, UUID friendId);

    UserResponse addFriend(UUID userId, UUID friendId);

    void removeFriend(UUID userId, UUID friendId);
}

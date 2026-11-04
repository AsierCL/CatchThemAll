package usc.enser.CatchThemAll.presentation.controller;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.databind.JsonNode;
import usc.enser.CatchThemAll.presentation.dto.FriendRequest;
import usc.enser.CatchThemAll.presentation.dto.UserResponse;
import usc.enser.CatchThemAll.presentation.dto.UserPutUpdateRequest;
import usc.enser.CatchThemAll.service.interfaces.ICurrentUserService;
import usc.enser.CatchThemAll.service.interfaces.IUserService;

@RestController
@RequestMapping("/users")
public class UserController {

    private final IUserService userService;
    private final ICurrentUserService currentUserService;

    public UserController(IUserService userService, ICurrentUserService currentUserService) {
        this.userService = userService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @JsonView(UserResponse.Basic.class)
    public List<UserResponse> findAll(@RequestParam(required = false) String name) {
        return userService.search(name);
    }

    @GetMapping("/ranking")
    @JsonView(UserResponse.Basic.class)
    public List<UserResponse> ranking() {
        return userService.ranking();
    }

    @GetMapping("/{id}")
    @JsonView(UserResponse.Basic.class)
    public UserResponse findById(@PathVariable UUID id) {
        return userService.findById(id);
    }

    @GetMapping("/{id}/full")
    @JsonView(UserResponse.Full.class)
    public UserResponse findFullById(@PathVariable UUID id) {
        return userService.findById(id);
    }

    @GetMapping("/me")
    @JsonView(UserResponse.Full.class)
    public UserResponse me() {
        return userService.findById(currentUserService.getCurrentUserId());
    }

    @PutMapping("/me")
    @JsonView(UserResponse.Full.class)
    public UserResponse putUpdate(@PathVariable UUID id, @RequestBody @Valid UserPutUpdateRequest request) throws AccessDeniedException {
        if(currentUserService.getCurrentUserId().equals(id)){
            return userService.putUpdate(id, request);
        }else {
            throw new AccessDeniedException("No puedes subir capturas por otro usuario");
        }
    }

    @PatchMapping(
            value = "/me",
            consumes = "application/json-patch+json"
    )
    @JsonView(UserResponse.Full.class)
    public UserResponse patchUpdate(@PathVariable UUID id, @RequestBody JsonNode request) throws AccessDeniedException {
        if(currentUserService.getCurrentUserId().equals(id)){
            return userService.patchUpdate(id, request);
        }else {
            throw new AccessDeniedException("No puedes subir capturas por otro usuario");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/friends")
    @JsonView(UserResponse.Basic.class)
    public List<UserResponse> friends(@PathVariable UUID id) {
        return userService.friends(id);
    }

    @GetMapping("/{id}/friends/{friendId}")
    @JsonView(UserResponse.Full.class)
    public UserResponse getFriendProfile(@PathVariable UUID id, @PathVariable UUID friendId) {
        return userService.getFriendProfile(id, friendId);
    }

    @PostMapping("/{id}/friends")
    public UserResponse addFriend(@PathVariable UUID id, @RequestBody @Valid FriendRequest request) {
        return userService.addFriend(id, request.friendId());
    }

    @DeleteMapping("/me/friends/{friendId}")
    public ResponseEntity<Void> removeFriend(@PathVariable UUID id, @PathVariable UUID friendId) throws AccessDeniedException {
        if(currentUserService.getCurrentUserId().equals(id)){
            userService.removeFriend(id, friendId);
        }else {
            throw new AccessDeniedException("No puedes subir capturas por otro usuario");
        }
        return ResponseEntity.noContent().build();
    }

}

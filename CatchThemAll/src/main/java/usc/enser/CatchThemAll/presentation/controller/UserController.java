package usc.enser.CatchThemAll.presentation.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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

import usc.enser.CatchThemAll.exception.ApiException;
import usc.enser.CatchThemAll.presentation.dto.FriendRequest;
import usc.enser.CatchThemAll.presentation.dto.UserResponse;
import usc.enser.CatchThemAll.presentation.dto.UserUpdateRequest;
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
    public List<UserResponse> findAll(@RequestParam(required = false) String name) {
        return userService.search(name);
    }

    @GetMapping("/ranking")
    public List<UserResponse> ranking() {
        return userService.ranking();
    }

    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable UUID id) {
        return userService.findById(id);
    }

    @GetMapping("/me")
    public UserResponse me() {
        return userService.findById(currentUserService.getCurrentUserId());
    }

    @PutMapping("/{id}")
    @PatchMapping("/{id}")
    public UserResponse update(@PathVariable UUID id, @RequestBody @Valid UserUpdateRequest request) {
        return userService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/friends")
    public List<UserResponse> friends(@PathVariable UUID id) {
        return userService.friends(id);
    }

    @GetMapping("/{id}/friends/{friendId}")
    public UserResponse getFriendProfile(@PathVariable UUID id, @PathVariable UUID friendId) {
        return userService.getFriendProfile(id, friendId);
    }

    @PostMapping("/{id}/friends/{friendId}")
    public UserResponse addFriend(@PathVariable UUID id, @PathVariable UUID friendId) {
        return userService.addFriend(id, friendId);
    }

    @PostMapping("/{id}/friends")
    public UserResponse addFriend(@PathVariable UUID id, @RequestBody @Valid FriendRequest request) {
        return userService.addFriend(id, request.friendId());
    }

    @DeleteMapping("/{id}/friends/{friendId}")
    public ResponseEntity<Void> removeFriend(@PathVariable UUID id, @PathVariable UUID friendId) {
        userService.removeFriend(id, friendId);
        return ResponseEntity.noContent().build();
    }

}

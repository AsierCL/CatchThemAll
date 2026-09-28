package usc.enser.CatchThemAll.presentation.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import usc.enser.CatchThemAll.presentation.dto.UserCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.UserResponse;
import usc.enser.CatchThemAll.presentation.dto.UserUpdateRequest;
import usc.enser.CatchThemAll.service.interfaces.IUserService;

@RestController
@RequestMapping("/users")
public class UserController {

    private final IUserService userService;

    public UserController(IUserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @GetMapping("/ranking")
    public List<UserResponse> ranking() {
        return userService.ranking();
    }

    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable UUID id) {
        return userService.findById(id);
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@RequestBody UserCreateRequest request) {
        UserResponse created = userService.create(request);
        return ResponseEntity.created(URI.create("/users/" + created.userId())).body(created);
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable UUID id, @RequestBody UserUpdateRequest request) {
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

    @PostMapping("/{id}/friends/{friendId}")
    public UserResponse addFriend(@PathVariable UUID id, @PathVariable UUID friendId) {
        return userService.addFriend(id, friendId);
    }

    @DeleteMapping("/{id}/friends/{friendId}")
    public ResponseEntity<Void> removeFriend(@PathVariable UUID id, @PathVariable UUID friendId) {
        userService.removeFriend(id, friendId);
        return ResponseEntity.noContent().build();
    }
}

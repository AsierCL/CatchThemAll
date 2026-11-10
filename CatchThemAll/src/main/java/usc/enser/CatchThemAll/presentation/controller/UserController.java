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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import usc.enser.CatchThemAll.presentation.dto.ErrorDTO;
import tools.jackson.databind.JsonNode;
import usc.enser.CatchThemAll.presentation.dto.FriendRequest;
import usc.enser.CatchThemAll.presentation.dto.UserResponse;
import usc.enser.CatchThemAll.presentation.dto.UserPutUpdateRequest;
import usc.enser.CatchThemAll.service.interfaces.ICurrentUserService;
import usc.enser.CatchThemAll.service.interfaces.IUserService;

@RestController
@RequestMapping("/users")
@Tag(name = "Usuarios", description = "Perfiles, ranking y amistades.")
public class UserController {

    private final IUserService userService;
    private final ICurrentUserService currentUserService;

    public UserController(IUserService userService, ICurrentUserService currentUserService) {
        this.userService = userService;
        this.currentUserService = currentUserService;
    }

    @Operation(
            operationId = "listUsers",
            summary = "Listar usuarios",
            description = """
                    Devuelve todos los usuarios, o los que contienen el texto indicado en el nombre.
                    Las respuestas usan la vista basica: sin `photoUrl` ni `description`.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de usuarios"),
            @ApiResponse(responseCode = "500", description = "Error inesperado",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @GetMapping
    @JsonView(UserResponse.Basic.class)
    public List<UserResponse> findAll(
            @Parameter(description = "Texto a buscar dentro del nombre", example = "ada")
            @RequestParam(required = false) String name) {
        return userService.search(name);
    }

    @Operation(
            operationId = "getRanking",
            summary = "Ranking de usuarios",
            description = "Usuarios ordenados por puntaje descendente y, a igual puntaje, por nombre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ranking de usuarios"),
            @ApiResponse(responseCode = "500", description = "Error inesperado",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @GetMapping("/ranking")
    @JsonView(UserResponse.Basic.class)
    public List<UserResponse> ranking() {
        return userService.ranking();
    }

    @Operation(
            operationId = "getCurrentUser",
            summary = "Perfil del usuario autenticado",
            description = """
                    Resuelve el usuario a partir del `sub` del token JWT. Es una de las pocas
                    operaciones que exigen autenticacion. Devuelve la vista completa.
                    """,
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil del usuario autenticado"),
            @ApiResponse(responseCode = "401", description = "Falta el token o es invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "El usuario del token ya no existe",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @GetMapping("/me")
    @JsonView(UserResponse.Full.class)
    public UserResponse me() {
        return userService.findById(currentUserService.getCurrentUserId());
    }

    @Operation(
            operationId = "getUser",
            summary = "Consultar un usuario",
            description = "Devuelve el perfil publico (vista basica) del usuario.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuario encontrado"),
            @ApiResponse(responseCode = "400", description = "Identificador con formato invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "El usuario no existe",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @GetMapping("/{id}")
    @JsonView(UserResponse.Basic.class)
    public UserResponse findById(
            @Parameter(description = "Identificador del usuario", required = true) @PathVariable UUID id) {
        return userService.findById(id);
    }

    @Operation(
            operationId = "getUserFull",
            summary = "Consultar un usuario con detalle",
            description = "Igual que `GET /users/{id}` pero devuelve la vista completa, con `photoUrl` y `description`.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuario encontrado"),
            @ApiResponse(responseCode = "400", description = "Identificador con formato invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "El usuario no existe",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @GetMapping("/{id}/full")
    @JsonView(UserResponse.Full.class)
    public UserResponse findFullById(
            @Parameter(description = "Identificador del usuario", required = true) @PathVariable UUID id) {
        return userService.findById(id);
    }

    @Operation(
            operationId = "putCurrentUser",
            summary = "Reemplazar el perfil propio",
            description = """
                    Reemplaza el perfil del usuario autenticado: los tres campos del cuerpo son
                    obligatorios y el nombre tiene que seguir siendo unico. Solo se puede modificar el
                    perfil propio.

                    > La ruta es `/users/me`, pero el handler todavia declara un `@PathVariable` que la
                    > ruta no provee, asi que hoy toda peticion termina en `500`. Ver `TODO.md` en la
                    > raiz del repositorio.
                    """,
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil reemplazado",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "415", description = "Content-Type no soportado",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "El handler no puede resolver el `id` del path y falla antes de tocar el perfil",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @PutMapping("/me")
    @JsonView(UserResponse.Full.class)
    public UserResponse putUpdate(@Parameter(hidden = true) @PathVariable UUID id,
                                 @RequestBody @Valid UserPutUpdateRequest request) throws AccessDeniedException {
        if(currentUserService.getCurrentUserId().equals(id)){
            return userService.putUpdate(id, request);
        }else {
            throw new AccessDeniedException("No puedes subir capturas por otro usuario");
        }
    }

    @Operation(
            operationId = "patchCurrentUser",
            summary = "Aplicar un parche JSON al perfil propio",
            description = """
                    Aplica un documento JSON Patch (RFC 6902) sobre el perfil del usuario autenticado.
                    Es una actualizacion parcial de verdad: se envian solo las operaciones de los
                    campos que cambian, y el nombre resultante no puede quedar vacio ni duplicado.

                    El `Content-Type` tiene que ser `application/json-patch+json`.

                    > La ruta es `/users/me`, pero el handler todavia declara un `@PathVariable` que la
                    > ruta no provee, asi que hoy toda peticion termina en `500`. Ver `TODO.md` en la
                    > raiz del repositorio.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    description = "Array de operaciones JSON Patch sobre `/name`, `/description` o `/photoUrl`.",
                    content = @Content(
                            mediaType = "application/json-patch+json",
                            schema = @Schema(
                                    type = "array",
                                    example = "[{\"op\":\"replace\",\"path\":\"/description\",\"value\":\"Cazadora de famosos\"}]"))),
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil parcheado",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "415", description = "Content-Type distinto de `application/json-patch+json`",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "El handler no puede resolver el `id` del path y falla antes de tocar el perfil",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @PatchMapping(
            value = "/me",
            consumes = "application/json-patch+json"
    )
    @JsonView(UserResponse.Full.class)
    public UserResponse patchUpdate(@Parameter(hidden = true) @PathVariable UUID id,
                                    @RequestBody JsonNode request) throws AccessDeniedException {
        if(currentUserService.getCurrentUserId().equals(id)){
            return userService.patchUpdate(id, request);
        }else {
            throw new AccessDeniedException("No puedes subir capturas por otro usuario");
        }
    }

    @Operation(
            operationId = "deleteUser",
            summary = "Eliminar un usuario",
            description = """
                    Elimina la cuenta junto con sus capturas y sus amistades. No verifica que el usuario
                    autenticado coincida con `{id}`.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Usuario eliminado"),
            @ApiResponse(responseCode = "400", description = "Identificador con formato invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "El usuario no existe",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Identificador del usuario", required = true) @PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            operationId = "listFriends",
            summary = "Listar amistades",
            description = "Devuelve los amigos del usuario indicado, en vista basica.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de amistades"),
            @ApiResponse(responseCode = "400", description = "Identificador con formato invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "El usuario no existe",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @GetMapping("/{id}/friends")
    @JsonView(UserResponse.Basic.class)
    public List<UserResponse> friends(
            @Parameter(description = "Identificador del usuario", required = true) @PathVariable UUID id) {
        return userService.friends(id);
    }

    @Operation(
            operationId = "getFriendProfile",
            summary = "Consultar el perfil de una amistad",
            description = """
                    Devuelve la vista completa del amigo, siempre que exista la amistad con el usuario
                    indicado en el path.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil del amigo"),
            @ApiResponse(responseCode = "400", description = "Identificador con formato invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "El usuario existe pero la amistad no",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @GetMapping("/{id}/friends/{friendId}")
    @JsonView(UserResponse.Full.class)
    public UserResponse getFriendProfile(
            @Parameter(description = "Identificador del usuario", required = true) @PathVariable UUID id,
            @Parameter(description = "Identificador del amigo", required = true) @PathVariable UUID friendId) {
        return userService.getFriendProfile(id, friendId);
    }

    @Operation(
            operationId = "addFriend",
            summary = "Agregar una amistad",
            description = """
                    Crea la amistad bidireccional. Si ya existia, devuelve el usuario sin cambios y con
                    `200`. No se permite agregarse a uno mismo.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Amistad creada o ya existente"),
            @ApiResponse(responseCode = "400", description = "Se intento agregar a uno mismo o el cuerpo es invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Alguno de los dos usuarios no existe",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Error inesperado al validar el cuerpo",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @PostMapping("/{id}/friends")
    public UserResponse addFriend(
            @Parameter(description = "Identificador del usuario", required = true) @PathVariable UUID id,
            @RequestBody @Valid FriendRequest request) {
        return userService.addFriend(id, request.friendId());
    }

    @Operation(
            operationId = "removeFriend",
            summary = "Quitar una amistad",
            description = """
                    Elimina la amistad bidireccional. Solo se pueden quitar amistades propias: el `{id}`
                    del path tiene que coincidir con el usuario del token.

                    > El rechazo por propiedad todavia devuelve `500` en lugar de `403`. Ver `TODO.md`
                    > en la raiz del repositorio.
                    """,
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Amistad eliminada"),
            @ApiResponse(responseCode = "400", description = "Identificador con formato invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "401", description = "Falta el token o es invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "La amistad no existe",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "El `{id}` no coincide con el usuario del token",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @DeleteMapping("/{id}/friends/{friendId}")
    public ResponseEntity<Void> removeFriend(
            @Parameter(description = "Identificador del usuario", required = true) @PathVariable UUID id,
            @Parameter(description = "Identificador del amigo", required = true) @PathVariable UUID friendId) throws AccessDeniedException {

        if(currentUserService.getCurrentUserId().equals(id)){
            userService.removeFriend(id, friendId);
        }else {
            throw new AccessDeniedException("No puedes subir capturas por otro usuario");
        }
        return ResponseEntity.noContent().build();
    }

}

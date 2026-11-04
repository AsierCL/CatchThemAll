package usc.enser.CatchThemAll.presentation.dto;

import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonView;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Representacion de un usuario.
 *
 * <p>La misma clase se serializa con dos vistas de Jackson: {@link Basic} para listados y
 * {@link Full} para el perfil propio. Los campos anotados solo con {@code Full} no aparecen en las
 * respuestas basicas, porque {@code spring.jackson.mapper.default-view-inclusion=false}.</p>
 */
@Schema(
        name = "UserResponse",
        description = """
                Perfil de usuario. Incluye siempre `userId`, `name`, `score`, `captureCount` y `friendIds`;
                `photoUrl` y `description` aparecen solo en las respuestas que usan la vista completa
                (`GET /users/{id}/full`, `GET /users/me`, `PUT`/`PATCH /users/{id}` y
                `GET /users/{id}/friends/{friendId}`).""")
public record UserResponse(

        @Schema(description = "Identificador del usuario.", example = "3f5c1c1e-6a7b-4d8e-9f10-2b3c4d5e6f70")
        @JsonView(Basic.class)
        UUID userId,

        @Schema(description = "Nombre de usuario.", example = "ada")
        @JsonView(Basic.class)
        String name,

        @Schema(
                description = "URL de la foto de perfil. Solo en la vista completa.",
                example = "https://cdn.example.com/users/ada.jpg")
        @JsonView(Full.class)
        String photoUrl,

        @Schema(description = "Puntaje acumulado por capturas. `0` cuando nunca se asigno.", example = "120")
        @JsonView(Basic.class)
        int score,

        @Schema(description = "Cantidad de capturas registradas por el usuario.", example = "12")
        @JsonView(Basic.class)
        int captureCount,

        @Schema(
                description = "Identificadores de sus amigos (solo los ids, no el perfil completo).",
                example = "[\"8a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d\"]")
        @JsonView(Basic.class)
        Set<UUID> friendIds,

        @Schema(
                description = "Descripcion libre del perfil. Solo en la vista completa.",
                example = "Cazadora de famosos del siglo XIX")
        @JsonView(Full.class)
        String description
) {
    public interface Basic {}
    public interface Full extends Basic {}
}

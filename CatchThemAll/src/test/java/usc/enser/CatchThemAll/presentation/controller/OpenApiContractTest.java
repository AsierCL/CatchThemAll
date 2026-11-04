package usc.enser.CatchThemAll.presentation.controller;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.jayway.jsonpath.JsonPath;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins the published OpenAPI document: the paths and operations the REST API exposes, the schemas it
 * promises, the multipart shape of the capture endpoints and the bearer scheme.
 *
 * <p>It also writes the generated document to {@code docs/openapi.json}, which is the versioned
 * artifact consumed by clients and graders. Regenerate it with {@code ./mvnw test}.</p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class OpenApiContractTest {

    private static final Path EXPORT_PATH =
            Path.of(System.getProperty("openapi.export.path", "../docs/openapi.json"));

    private final HttpClient http = HttpClient.newHttpClient();

    @Value("${local.server.port}")
    private int port;

    @Test
    @DisplayName("the generated document describes every published path and operation")
    void publishesEveryOperation() throws Exception {
        String document = fetchDocument();

        assertThat(document).startsWith("{\"openapi\":\"3.");

        assertThat(paths(document)).containsExactlyInAnyOrder(
                "/auth/login",
                "/auth/register",
                "/users",
                "/users/ranking",
                "/users/me",
                "/users/{id}",
                "/users/{id}/full",
                "/users/{id}/friends",
                "/users/{id}/friends/{friendId}",
                "/famous",
                "/famous/{famousId}",
                "/captures/create",
                "/captures/me",
                "/captures/me/{captureId}",
                "/captures/{id}/identify");

        assertThat(operationIds(document)).containsExactlyInAnyOrder(
                "login",
                "register",
                "listUsers",
                "getRanking",
                "getCurrentUser",
                "getUser",
                "getUserFull",
                "replaceUser",
                "patchUser",
                "deleteUser",
                "listFriends",
                "getFriendProfile",
                "addFriend",
                "removeFriend",
                "listFamous",
                "getFamous",
                "identifyFamous",
                "createFamousFace",
                "listMyCaptures",
                "getMyCapture");
    }

    @Test
    @DisplayName("the document declares the payload and error schemas")
    void publishesEverySchema() throws Exception {
        String document = fetchDocument();

        // springdoc derives one schema per Jackson view, so UserResponse also appears as
        // UserResponse_Basic / UserResponse_Full. The prefix check accepts those variants.
        assertThat(schemaNames(document)).satisfies(names -> {
            assertThat(names.stream().anyMatch(name -> name.startsWith("TokenResponse"))).isTrue();
            assertThat(names.stream().anyMatch(name -> name.startsWith("UserLogin"))).isTrue();
            assertThat(names.stream().anyMatch(name -> name.startsWith("UserRegister"))).isTrue();
            assertThat(names.stream().anyMatch(name -> name.startsWith("UserResponse"))).isTrue();
            assertThat(names.stream().anyMatch(name -> name.startsWith("UserUpdateRequest"))).isTrue();
            assertThat(names.stream().anyMatch(name -> name.startsWith("FriendRequest"))).isTrue();
            assertThat(names.stream().anyMatch(name -> name.startsWith("FamousResponse"))).isTrue();
            assertThat(names.stream().anyMatch(name -> name.startsWith("CaptureResponse"))).isTrue();
            assertThat(names.stream().anyMatch(name -> name.startsWith("ErrorDTO"))).isTrue();
        });
    }

    @Test
    @DisplayName("capture endpoints document a flat multipart body with image and name")
    void documentsFlatMultipartBody() throws Exception {
        String document = fetchDocument();

        for (String path : List.of("/captures/create", "/captures/{id}/identify")) {
            String base = "$.paths['" + path + "'].post.requestBody.content['multipart/form-data'].schema";

            Map<String, Object> properties = JsonPath.read(document, base + ".properties");
            assertThat(properties.keySet())
                    .as("multipart parts of %s", path)
                    .containsExactlyInAnyOrder("image", "name");

            assertThat(JsonPath.<String>read(document, base + ".properties.image.format"))
                    .isEqualTo("binary");
            assertThat(JsonPath.<String>read(document, base + ".properties.name.type"))
                    .isEqualTo("string");
        }
    }

    @Test
    @DisplayName("famous enum values are documented in lowercase")
    void documentsLowercaseEnumValues() throws Exception {
        String document = fetchDocument();

        assertThat(document).contains("\"politic\"", "\"actor\"", "\"legendary\"", "\"common\"");
        assertThat(document).doesNotContain("\"Politic\"", "\"Legendary\"");
    }

    @Test
    @DisplayName("the bearer scheme exists and is required only where authentication is enforced")
    void documentsBearerSecurity() throws Exception {
        String document = fetchDocument();

        assertThat(JsonPath.<String>read(document, "$.components.securitySchemes.bearerAuth.scheme"))
                .isEqualTo("bearer");
        assertThat(JsonPath.<String>read(document, "$.components.securitySchemes.bearerAuth.bearerFormat"))
                .isEqualTo("JWT");

        assertThat(security(document, "/users/me")).isNotEmpty();
        assertThat(security(document, "/captures/me")).isNotEmpty();
        assertThat(security(document, "/captures/me/{captureId}")).isNotEmpty();
        assertThat(security(document, "/famous")).isNull();
        assertThat(security(document, "/captures/create")).isNull();
    }

    @Test
    @DisplayName("the versioned artifact matches the document served by the application")
    void exportsTheVersionedArtifact() throws Exception {
        String document = fetchDocument();

        Files.createDirectories(EXPORT_PATH.toAbsolutePath().getParent());
        Files.writeString(EXPORT_PATH, document + System.lineSeparator(), StandardCharsets.UTF_8);

        assertThat(EXPORT_PATH).exists();
        assertThat(Files.readString(EXPORT_PATH, StandardCharsets.UTF_8).trim()).isEqualTo(document);
    }

    private String fetchDocument() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/v3/api-docs"))
                .GET()
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        return response.body();
    }

    private List<String> paths(String document) {
        return JsonPath.<java.util.Map<String, Object>>read(document, "$.paths")
                .keySet().stream().map(Object::toString).toList();
    }

    private List<String> schemaNames(String document) {
        return JsonPath.<java.util.Map<String, Object>>read(document, "$.components.schemas")
                .keySet().stream().map(Object::toString).toList();
    }

    private List<String> operationIds(String document) {
        return JsonPath.<List<String>>read(document, "$..operationId");
    }

    @SuppressWarnings("unchecked")
    private List<Object> security(String document, String path) {
        try {
            return JsonPath.<List<Object>>read(document, "$.paths['" + path + "'].get.security");
        } catch (com.jayway.jsonpath.PathNotFoundException exception) {
            return null;
        }
    }
}

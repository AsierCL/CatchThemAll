package usc.enser.CatchThemAll.presentation.controller;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;
import usc.enser.CatchThemAll.persistence.entities.Famous;
import usc.enser.CatchThemAll.persistence.repositories.FamousRepository;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins the JSON and query-parameter representation of the famous enums: every value travels in
 * lowercase and every input is accepted case-insensitively.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class FamousEnumContractTest {

    private final HttpClient http = HttpClient.newHttpClient();

    @Value("${local.server.port}")
    private int port;

    @Autowired
    private FamousRepository famousRepository;

    @BeforeEach
    void seed() {
        famousRepository.deleteAll();
        Famous famous = new Famous();
        famous.setPokedexNumber(1);
        famous.setName("Ada Lovelace");
        famous.setCategory(FamousCategories.Legendary);
        famous.setType(FamousTypes.Politic);
        famousRepository.save(famous);
    }

    @Test
    @DisplayName("famous enum values are serialized in lowercase")
    void serializesEnumValuesInLowercase() throws Exception {
        HttpResponse<String> response = get("/famous");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"type\":\"politic\"");
        assertThat(response.body()).contains("\"category\":\"legendary\"");
    }

    @Test
    @DisplayName("enum query parameters are accepted in any case")
    void acceptsEnumQueryParametersInAnyCase() throws Exception {
        assertThat(get("/famous?type=politic").body()).contains("\"name\":\"Ada Lovelace\"");
        assertThat(get("/famous?type=POLITIC").body()).contains("\"name\":\"Ada Lovelace\"");
        assertThat(get("/famous?type=Politic").body()).contains("\"name\":\"Ada Lovelace\"");
        assertThat(get("/famous?category=LEGENDARY").body()).contains("\"name\":\"Ada Lovelace\"");
        assertThat(get("/famous?type=politic&category=legendary").body()).contains("\"name\":\"Ada Lovelace\"");
    }

    @Test
    @DisplayName("an unknown enum query parameter is a malformed request")
    void rejectsUnknownEnumQueryParameter() throws Exception {
        HttpResponse<String> response = get("/famous?type=astronaut");

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.body()).contains("\"message\":\"malformed request\"");
    }

    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }
}

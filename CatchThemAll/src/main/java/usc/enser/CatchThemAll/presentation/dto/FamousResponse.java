package usc.enser.CatchThemAll.presentation.dto;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;

@Schema(name = "FamousResponse", description = "Famoso del catalogo junto con sus estadisticas de captura.")
public record FamousResponse(

        @Schema(
                description = "Identificador del famoso.",
                example = "8a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d")
        UUID famousId,

        @Schema(description = "Numero de la Pokedex con el que se ordena el catalogo.", example = "1")
        Integer pokedexNumber,

        @Schema(description = "Nombre del famoso.", example = "Ada Lovelace")
        String name,

        @Schema(description = "Categoria de rareza. Siempre en minusculas.", example = "legendary")
        FamousCategories category,

        @Schema(description = "Ambito por el que es famoso. Siempre en minusculas.", example = "politic")
        FamousTypes type,

        @Schema(description = "Total de capturas registradas de este famoso.", example = "42")
        long captureCount,

        @Schema(description = "Cantidad de usuarios distintos que capturaron a este famoso.", example = "7")
        long collectorCount
) {
}

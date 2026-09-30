package usc.enser.CatchThemAll.presentation.dto;

import java.util.UUID;

import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;

public record FamousResponse (

    UUID famousId,
    Integer pokedexNumber,
    String name,
    FamousCategories category,
    FamousTypes type

) {

}

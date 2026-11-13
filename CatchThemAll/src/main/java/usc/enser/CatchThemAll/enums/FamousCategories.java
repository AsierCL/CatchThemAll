package usc.enser.CatchThemAll.enums;

import java.util.Arrays;
import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Categoria de un famoso dentro de la Pokedex.
 *
 * <p>El nombre de la constante es el que se persiste en la base de datos; el valor que viaja por la
 * API es siempre su forma en minusculas y se acepta sin distinguir mayusculas al recibirlo.</p>
 */
public enum FamousCategories {

    Legendary,
    Epic,
    Rare,
    Common;

    @JsonValue
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator
    public static FamousCategories fromValue(String raw) {
        return EnumUtils.fromValue(FamousCategories.class,raw);
    }
}

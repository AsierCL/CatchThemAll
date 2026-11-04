package usc.enser.CatchThemAll.enums;

import java.util.Arrays;
import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Tipo de famoso dentro de la Pokedex.
 *
 * <p>El nombre de la constante es el que se persiste en la base de datos; el valor que viaja por la
 * API es siempre su forma en minusculas y se acepta sin distinguir mayusculas al recibirlo.</p>
 */
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.Locale;

public enum FamousTypes {

    Politic,
    Actor,
    Writer,
    Musician,
    Teacher,
    Meme;

    @JsonValue
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator
    public static FamousTypes fromValue(String raw) {
        if (raw == null) {
            return null;
        }
        String candidate = raw.trim();
        return Arrays.stream(values())
                .filter(type -> type.name().equalsIgnoreCase(candidate))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("unknown famous type: " + raw));
    }
}

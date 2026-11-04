package usc.enser.CatchThemAll.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.Locale;

public enum FamousCategories {

    Legendary,
    Epic,
    Rare,
    Common;

    @JsonCreator
    public static FamousCategories fromString(String value) {
        return Arrays.stream(values())
                .filter(c -> c.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid category"));
    }

    @JsonValue
    public String toValue(){
        return name().toLowerCase(Locale.ROOT);
    }

}

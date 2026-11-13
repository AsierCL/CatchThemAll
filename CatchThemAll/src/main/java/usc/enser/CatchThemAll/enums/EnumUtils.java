package usc.enser.CatchThemAll.enums;

import java.util.Arrays;
import java.util.Locale;

public class EnumUtils {

    private EnumUtils() {
    }

    public static <E extends Enum<E>> E fromValue(Class<E> enumClass, String value) {
        if (value == null) {
            throw new IllegalArgumentException(
                    "El valor del enum no puede ser null"
            );
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);

        return Arrays.stream(enumClass.getEnumConstants())
                .filter(e -> e.name().toLowerCase(Locale.ROOT)
                        .equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Valor desconocido para " + enumClass.getSimpleName()
                                + ": " + value
                ));
    }
}

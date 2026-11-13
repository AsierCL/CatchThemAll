package usc.enser.CatchThemAll.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;
import org.springframework.stereotype.Component;
import usc.enser.CatchThemAll.enums.EnumUtils;

/**
 * Makes every enum-valued query parameter case-insensitive.
 *
 * <p>Path variables and query parameters are converted by Spring's conversion service, which does not
 * use Jackson, so the lowercase convention declared with {@code @JsonCreator} on the enums has to be
 * mirrored here. Unknown values throw {@link IllegalArgumentException}, which the controller advice
 * reports as {@code 400 malformed request}.</p>
 */

@Component
public class CaseInsensitiveEnumConverterFactory implements ConverterFactory<String, Enum> {

    @Override
    public <T extends Enum> Converter<String, T> getConverter(Class<T> targetType) {
        return source -> convert(targetType, source);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private <T extends Enum> T convert(Class<T> targetType, String source) {
        return (T) EnumUtils.fromValue(
                (Class) targetType,
                source
        );
    }
}


package usc.enser.CatchThemAll.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;
import org.springframework.format.FormatterRegistry;
import org.springframework.lang.Nullable;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Makes every enum-valued query parameter case-insensitive.
 *
 * <p>Path variables and query parameters are converted by Spring's conversion service, which does not
 * use Jackson, so the lowercase convention declared with {@code @JsonCreator} on the enums has to be
 * mirrored here. Unknown values throw {@link IllegalArgumentException}, which the controller advice
 * reports as {@code 400 malformed request}.</p>
 */
@Configuration
public class EnumConversionConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverterFactory(new CaseInsensitiveEnumConverterFactory());
    }

    static final class CaseInsensitiveEnumConverterFactory implements ConverterFactory<String, Enum<?>> {

        @Override
        public <T extends Enum<?>> Converter<String, T> getConverter(Class<T> targetType) {
            return new CaseInsensitiveEnumConverter<>(targetType);
        }
    }

    static final class CaseInsensitiveEnumConverter<T extends Enum<?>> implements Converter<String, T> {

        private final T[] constants;

        private CaseInsensitiveEnumConverter(Class<T> targetType) {
            this.constants = targetType.getEnumConstants();
        }

        @Override
        @Nullable
        public T convert(@Nullable String source) {
            if (source == null) {
                return null;
            }
            String candidate = source.trim();
            if (candidate.isEmpty()) {
                return null;
            }
            for (T constant : constants) {
                if (constant.name().equalsIgnoreCase(candidate)) {
                    return constant;
                }
            }
            throw new IllegalArgumentException("unknown value: " + source);
        }
    }
}

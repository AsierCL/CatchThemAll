package usc.enser.CatchThemAll.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import usc.enser.CatchThemAll.enums.CaseInsensitiveEnumConverterFactory;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final CaseInsensitiveEnumConverterFactory enumConverterFactory;

    public WebConfig(
            CaseInsensitiveEnumConverterFactory enumConverterFactory) {
        this.enumConverterFactory = enumConverterFactory;
    }

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverterFactory(enumConverterFactory);
    }
}
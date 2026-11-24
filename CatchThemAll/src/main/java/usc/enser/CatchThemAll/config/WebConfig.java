package usc.enser.CatchThemAll.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import usc.enser.CatchThemAll.aspect.RateLimitingInterceptor;
import usc.enser.CatchThemAll.enums.CaseInsensitiveEnumConverterFactory;

@Configuration
@EnableSpringDataWebSupport(
        pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO
)
public class WebConfig implements WebMvcConfigurer {

    private final CaseInsensitiveEnumConverterFactory enumConverterFactory;
    private final RateLimitingInterceptor rateLimitingInterceptor;

    public WebConfig(
            CaseInsensitiveEnumConverterFactory enumConverterFactory, RateLimitingInterceptor rateLimitingInterceptor) {
        this.enumConverterFactory = enumConverterFactory;
        this.rateLimitingInterceptor = rateLimitingInterceptor;
    }

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverterFactory(enumConverterFactory);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitingInterceptor)
                .addPathPatterns("/**")// Aplícase a todos os endpoints da API
                .excludePathPatterns("/api/public/**");   // (Opcional) Rutas excluídas
    }
}
package usc.enser.CatchThemAll.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;

import tools.jackson.databind.ObjectMapper;

import usc.enser.CatchThemAll.presentation.dto.ErrorDTO;

@Configuration
public class SecurityConfig {

    private final SecretKey jwtKey;

    public SecurityConfig(@Value("${security.jwt.secret}") String secret) {
        this.jwtKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            AuthenticationEntryPoint authenticationEntryPoint,
                                            AccessDeniedHandler accessDeniedHandler) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/users").permitAll()
                .requestMatchers(HttpMethod.GET, "/users/ranking").permitAll()
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(handling -> handling.accessDeniedHandler(accessDeniedHandler))
            .oauth2ResourceServer(oauth2 -> oauth2
                .authenticationEntryPoint(authenticationEntryPoint)
                .jwt(jwt -> {
                }));

        return http.build();
    }

    @Bean
    AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
        return (request, response, exception) -> writeError(
                response, objectMapper, HttpStatus.UNAUTHORIZED, "authentication required", request.getRequestURI());
    }

    @Bean
    AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
        return (request, response, exception) -> writeError(
                response, objectMapper, HttpStatus.FORBIDDEN, "access denied", request.getRequestURI());
    }

    private void writeError(HttpServletResponse response, ObjectMapper objectMapper, HttpStatus status,
                            String message, String path) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ErrorDTO body = new ErrorDTO(Instant.now(), status.value(), status.getReasonPhrase(), message, path, List.of());
        objectMapper.writeValue(response.getOutputStream(), body);
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    JwtEncoder jwtEncoder() {
        return NimbusJwtEncoder.withSecretKey(jwtKey).algorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(jwtKey).macAlgorithm(MacAlgorithm.HS256).build();
    }
}

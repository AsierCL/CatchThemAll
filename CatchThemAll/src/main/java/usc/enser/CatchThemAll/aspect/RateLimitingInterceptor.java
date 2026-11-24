package usc.enser.CatchThemAll.aspect;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import usc.enser.CatchThemAll.annotations.RateLimited;
import usc.enser.CatchThemAll.exception.ApiException;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final Cache<String, Bucket> cache = Caffeine.newBuilder()
            .maximumSize(50_000)
            .expireAfterAccess(Duration.ofHours(1))
            .build();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        // Buscamos a anotación no método ou na clase do controlador
        var ref = new Object() {
            RateLimited config = handlerMethod.getMethodAnnotation(RateLimited.class);
        };
        if (ref.config == null) {
            ref.config = handlerMethod.getBeanType().getAnnotation(RateLimited.class);
        }
        if (ref.config == null) {
            return true; // Endpoint sen límite específico
        }

        // Clave combinando IP/Usuario + Nome do método destino
        String key = request.getRemoteAddr() + ":" + handlerMethod.getMethod().toGenericString();
        Bucket bucket = cache.get(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(ref.config.capacity())
                        .refillGreedy(ref.config.capacity(), Duration.of(ref.config.duration(), ref.config.unit()))
                        .build())
                .build());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            return true;
        }

        long waitSeconds = Math.max(1, TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()));
        response.addHeader("Retry-After", String.valueOf(waitSeconds));
        throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,"Demasiadas peticións a este recurso");
    }
}

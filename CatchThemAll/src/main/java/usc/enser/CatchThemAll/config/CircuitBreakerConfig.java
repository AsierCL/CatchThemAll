package usc.enser.CatchThemAll.config;

import io.github.resilience4j.common.circuitbreaker.configuration.CircuitBreakerConfigCustomizer;
import io.grpc.StatusException;
import io.grpc.StatusRuntimeException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CircuitBreakerConfig {

    @Bean
    public CircuitBreakerConfigCustomizer facialRecognitionCustomizer() {
        return CircuitBreakerConfigCustomizer
                .of("facialRecognition", builder ->
                        builder.recordException(exception -> {
                            Throwable cause = exception;

                            while (cause != null) {
                                if (cause instanceof StatusRuntimeException || cause instanceof StatusException) {
                                    return true;
                                }

                                cause = cause.getCause();
                            }

                            return false;
                        })
                );
    }
}

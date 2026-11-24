package usc.enser.CatchThemAll.config;

import java.util.concurrent.*;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AsyncConfig {

    @Bean
    Executor grpcExecutor() {
        return new ThreadPoolExecutor(
                4,
                16,
                60L,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(100),
                new ThreadPoolExecutor.AbortPolicy()
        );
    }
}

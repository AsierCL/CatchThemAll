package usc.enser.CatchThemAll.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();

        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(10))
                .maximumSize(500));

        manager.registerCustomCache("famous", Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofDays(1))
                .maximumSize(300)
                .recordStats()
                .build());

        manager.registerCustomCache("ranking", Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofHours(1))
                .maximumSize(100)
                .build());

        manager.registerCustomCache("captures", Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(15))
                .maximumSize(100)
                .recordStats()
                .build());

        return manager;
    }

}

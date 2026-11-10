package usc.enser.CatchThemAll.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Cache en memoria de las lecturas mas usadas.
 *
 * <p>Las duraciones viven en {@code application.properties} ({@code cache.*.ttl}) y no aca: el mismo
 * valor lo publica el documento OpenAPI en su descripcion, asi que si se ajusta tiene que cambiar en
 * un solo lugar.</p>
 */
@Configuration
@EnableCaching
public class CacheConfig {

    private final Duration famousTtl;
    private final Duration rankingTtl;
    private final Duration capturesTtl;

    public CacheConfig(@Value("${cache.famous.ttl}") Duration famousTtl,
                       @Value("${cache.ranking.ttl}") Duration rankingTtl,
                       @Value("${cache.captures.ttl}") Duration capturesTtl) {
        this.famousTtl = famousTtl;
        this.rankingTtl = rankingTtl;
        this.capturesTtl = capturesTtl;
    }

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();

        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(10))
                .maximumSize(500));

        manager.registerCustomCache("famous", Caffeine.newBuilder()
                .expireAfterWrite(famousTtl)
                .maximumSize(300)
                .recordStats()
                .build());

        manager.registerCustomCache("ranking", Caffeine.newBuilder()
                .expireAfterWrite(rankingTtl)
                .maximumSize(100)
                .build());

        manager.registerCustomCache("captures", Caffeine.newBuilder()
                .expireAfterWrite(capturesTtl)
                .maximumSize(100)
                .recordStats()
                .build());

        return manager;
    }

}

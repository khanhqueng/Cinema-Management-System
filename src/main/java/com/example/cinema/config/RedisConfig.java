package com.example.cinema.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis configuration for distributed locking and caching
 */
@Configuration
public class RedisConfig {

    @Value("${spring.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.redis.port:6379}")
    private int redisPort;

    @Value("${spring.redis.password:}")
    private String redisPassword;

    /**
     * Configure Redisson client for distributed locking
     */
    @Bean
    public RedissonClient redissonClient() {
        Config config = new Config();
        String redisAddress = "redis://" + redisHost + ":" + redisPort;

        config.useSingleServer()
                .setAddress(redisAddress)
                .setConnectionMinimumIdleSize(5)
                .setConnectionPoolSize(10)
                .setRetryAttempts(3)
                .setRetryInterval(1000)
                .setTimeout(3000)
                .setConnectTimeout(5000);

        // Set password if provided
        if (redisPassword != null && !redisPassword.trim().isEmpty()) {
            config.useSingleServer().setPassword(redisPassword);
        }

        return Redisson.create(config);
    }

    /**
     * Configure Redis connection factory
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        LettuceConnectionFactory factory = new LettuceConnectionFactory(redisHost, redisPort);
        if (redisPassword != null && !redisPassword.trim().isEmpty()) {
            factory.setPassword(redisPassword);
        }
        return factory;
    }

    /**
     * Configure RedisTemplate for general Redis operations
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Use String serializer for keys
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // Use JSON serializer for values
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());

        template.afterPropertiesSet();
        return template;
    }
}
package com.kalagram;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableAsync
@EnableJpaRepositories(considerNestedRepositories = true)
public class KalagramApplication {

    public static void main(String[] args) {
        SpringApplication.run(KalagramApplication.class, args);
    }
}

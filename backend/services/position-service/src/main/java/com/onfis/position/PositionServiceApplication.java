package com.onfis.position;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {"com.onfis.position", "com.onfis.shared"})
@EntityScan(basePackages = {"com.onfis.position.entity", "com.onfis.shared.dto"})
@EnableJpaAuditing
public class PositionServiceApplication {
    public static void main(String[] args) { SpringApplication.run(PositionServiceApplication.class, args); }
}

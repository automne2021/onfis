package com.onfis.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.cloud.openfeign.EnableFeignClients;

/** User Service Application */
@SpringBootApplication(scanBasePackages = {"com.onfis.user", "com.onfis.shared"})
@EntityScan(basePackages = {"com.onfis.user.entity"})
@EnableJpaAuditing
@EnableFeignClients
public class UserServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(UserServiceApplication.class, args);
  }
}

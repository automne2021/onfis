package com.onfis.chat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {"com.onfis.chat", "com.onfis.shared"})
@EntityScan(basePackages = {"com.onfis.chat.entity", "com.onfis.shared.dto"})
@EnableJpaAuditing
@EnableFeignClients
@ComponentScan(basePackages = "com.onfis.chat")
public class ChatServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(ChatServiceApplication.class, args);
  }
}

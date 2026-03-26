package com.sync.Antic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = { UserDetailsServiceAutoConfiguration.class })
public class AnticApplication {

    public static void main(String[] args) {
        SpringApplication.run(AnticApplication.class, args);
    }
}

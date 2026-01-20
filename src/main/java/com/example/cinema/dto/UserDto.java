package com.example.cinema.dto;

import com.example.cinema.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * User Data Transfer Object
 * Safe representation of User entity for API responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private User.Role role;
    private LocalDateTime createdAt;

    // Constructor from User entity
    public UserDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phone = user.getPhone();
        this.role = user.getRole();
        this.createdAt = user.getCreatedAt();
    }

    // Static factory method
    public static UserDto from(User user) {
        return new UserDto(user);
    }
}
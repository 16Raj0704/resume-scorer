package com.resumescorer.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ContactInfoDTO {
    private String name;
    private String email;
    private String phone;
    private String linkedin;
    private String github;
    private String location;
}

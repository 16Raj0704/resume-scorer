package com.resumescorer.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class WorkExperienceDTO {
    private String company;
    private String title;
    private String duration;
    private List<String> bullets;
}

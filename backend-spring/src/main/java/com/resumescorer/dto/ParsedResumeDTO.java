package com.resumescorer.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ParsedResumeDTO {
    private String rawText;
    private String cleanedText;
    private Map<String, String> sections;        // e.g. "experience" -> content
    private List<String> extractedKeywords;
    private List<String> skills;
    private List<WorkExperienceDTO> workExperience;
    private EducationDTO education;
    private ContactInfoDTO contactInfo;
    private List<String> bulletPoints;
    private int wordCount;
    private double readabilityScore;
    private List<String> atsWarnings;
}

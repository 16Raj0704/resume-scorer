package com.resumescorer.service;

import org.apache.pdfbox.Loader;
import com.resumescorer.dto.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;

@Service
public class ResumeParserService {

    private static final Set<String> TECH_KEYWORDS = new HashSet<>(Arrays.asList(
        "java", "python", "javascript", "typescript", "react", "node", "spring", "springboot",
        "aws", "gcp", "azure", "docker", "kubernetes", "kafka", "redis", "postgresql", "mysql",
        "mongodb", "graphql", "rest", "api", "microservices", "ci/cd", "git", "agile", "scrum",
        "machine learning", "ml", "deep learning", "tensorflow", "pytorch", "sql", "nosql",
        "html", "css", "vue", "angular", "nextjs", "express", "django", "flask", "fastapi",
        "hibernate", "jpa", "maven", "gradle", "jenkins", "terraform", "ansible", "linux",
        "bash", "scala", "kotlin", "golang", "rust", "c++", "c#", "dotnet", "rails", "ruby"
    ));

    private static final List<String> SECTION_HEADERS = Arrays.asList(
        "experience", "work experience", "employment", "education", "skills", "technical skills",
        "projects", "certifications", "summary", "objective", "achievements", "awards",
        "publications", "volunteer", "languages", "interests"
    );

    // Parse PDF file
    public ParsedResumeDTO parsePdf(MultipartFile file) throws IOException {
    try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
        PDFTextStripper stripper = new PDFTextStripper();
        String rawText = stripper.getText(doc);
        return parseText(rawText);
    }
}

    // Parse plain text
    public ParsedResumeDTO parseText(String rawText) {
        String cleanedText = cleanText(rawText);
        Map<String, String> sections = extractSections(cleanedText);
        List<String> skills = extractSkills(cleanedText);
        List<String> bullets = extractBulletPoints(cleanedText);
        ContactInfoDTO contact = extractContactInfo(rawText);
        List<WorkExperienceDTO> workExp = extractWorkExperience(sections.getOrDefault("experience", ""));
        EducationDTO education = extractEducation(sections.getOrDefault("education", ""));
        List<String> atsWarnings = checkATSWarnings(rawText, cleanedText);

        return ParsedResumeDTO.builder()
                .rawText(rawText)
                .cleanedText(cleanedText)
                .sections(sections)
                .extractedKeywords(skills)
                .skills(skills)
                .workExperience(workExp)
                .education(education)
                .contactInfo(contact)
                .bulletPoints(bullets)
                .wordCount(cleanedText.split("\\s+").length)
                .readabilityScore(calculateReadability(cleanedText))
                .atsWarnings(atsWarnings)
                .build();
    }

    private String cleanText(String text) {
        return text
                .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "") // control chars
                .replaceAll("[ \\t]+", " ")                                   // multiple spaces
                .replaceAll("\\n{3,}", "\n\n")                                // excess newlines
                .replaceAll("(?m)^\\s+$", "")                                 // blank lines
                .trim();
    }

    private Map<String, String> extractSections(String text) {
        Map<String, String> sections = new LinkedHashMap<>();
        String[] lines = text.split("\n");
        String currentSection = "header";
        StringBuilder currentContent = new StringBuilder();

        for (String line : lines) {
            String lower = line.toLowerCase().trim();
            boolean isHeader = SECTION_HEADERS.stream().anyMatch(h ->
                lower.equals(h) || lower.startsWith(h + ":") || lower.startsWith(h + " "));

            if (isHeader && lower.length() < 40) {
                sections.put(currentSection, currentContent.toString().trim());
                currentSection = lower.replaceAll("[:\\s]+$", "").trim();
                currentContent = new StringBuilder();
            } else {
                currentContent.append(line).append("\n");
            }
        }
        sections.put(currentSection, currentContent.toString().trim());
        return sections;
    }

    private List<String> extractSkills(String text) {
        String lower = text.toLowerCase();
        return TECH_KEYWORDS.stream()
                .filter(kw -> lower.contains(kw))
                .sorted()
                .collect(Collectors.toList());
    }

    private List<String> extractBulletPoints(String text) {
        List<String> bullets = new ArrayList<>();
        Pattern pattern = Pattern.compile("^[\\s]*[•\\-\\*\\u2022\\u2023\\u25E6]\\s*(.+)$", Pattern.MULTILINE);
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            String bullet = matcher.group(1).trim();
            if (bullet.length() > 20) bullets.add(bullet);
        }
        return bullets;
    }

    private ContactInfoDTO extractContactInfo(String text) {
        ContactInfoDTO contact = new ContactInfoDTO();
        String[] lines = text.split("\n");

        // Email
        Pattern emailPattern = Pattern.compile("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}");
        Matcher emailMatcher = emailPattern.matcher(text);
        if (emailMatcher.find()) contact.setEmail(emailMatcher.group());

        // Phone
        Pattern phonePattern = Pattern.compile("(\\+?\\d[\\s\\-.]?){10,13}");
        Matcher phoneMatcher = phonePattern.matcher(text);
        if (phoneMatcher.find()) contact.setPhone(phoneMatcher.group().trim());

        // LinkedIn
        Pattern linkedinPattern = Pattern.compile("linkedin\\.com/in/[\\w\\-]+", Pattern.CASE_INSENSITIVE);
        Matcher linkedinMatcher = linkedinPattern.matcher(text);
        if (linkedinMatcher.find()) contact.setLinkedin("https://" + linkedinMatcher.group());

        // GitHub
        Pattern githubPattern = Pattern.compile("github\\.com/[\\w\\-]+", Pattern.CASE_INSENSITIVE);
        Matcher githubMatcher = githubPattern.matcher(text);
        if (githubMatcher.find()) contact.setGithub("https://" + githubMatcher.group());

        // Name — first non-empty line of resume
        for (String line : lines) {
            if (!line.trim().isEmpty() && line.trim().length() > 2 && line.trim().length() < 60) {
                contact.setName(line.trim());
                break;
            }
        }

        return contact;
    }

    private List<WorkExperienceDTO> extractWorkExperience(String expSection) {
        List<WorkExperienceDTO> jobs = new ArrayList<>();
        if (expSection.isEmpty()) return jobs;

        String[] lines = expSection.split("\n");
        WorkExperienceDTO current = null;
        List<String> currentBullets = new ArrayList<>();

        Pattern datePattern = Pattern.compile("(\\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)", Pattern.CASE_INSENSITIVE);

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            boolean hasDate = datePattern.matcher(trimmed).find();
            boolean isBullet = trimmed.matches("^[•\\-\\*].*");

            if (hasDate && !isBullet && trimmed.length() < 100) {
                if (current != null) {
                    current.setBullets(new ArrayList<>(currentBullets));
                    jobs.add(current);
                    currentBullets.clear();
                }
                current = WorkExperienceDTO.builder()
                        .title(trimmed)
                        .company("")
                        .duration("")
                        .build();
            } else if (isBullet && current != null) {
                currentBullets.add(trimmed.replaceFirst("^[•\\-\\*]\\s*", ""));
            } else if (current != null && current.getCompany().isEmpty() && !isBullet) {
                current.setCompany(trimmed);
            }
        }
        if (current != null) {
            current.setBullets(currentBullets);
            jobs.add(current);
        }
        return jobs;
    }

    private EducationDTO extractEducation(String eduSection) {
        if (eduSection.isEmpty()) return new EducationDTO();

        EducationDTO edu = new EducationDTO();
        String[] lines = eduSection.split("\n");

        Pattern degreePattern = Pattern.compile("(B\\.?Tech|B\\.?E|B\\.?Sc|M\\.?Tech|MBA|B\\.?Com|MCA|BCA|Bachelor|Master|PhD|B\\.?S|M\\.?S)", Pattern.CASE_INSENSITIVE);
        Pattern yearPattern = Pattern.compile("(20\\d{2}|19\\d{2})");
        Pattern gpaPattern = Pattern.compile("(GPA|CGPA|CPI)[:\\s]*(\\d\\.\\d+)", Pattern.CASE_INSENSITIVE);

        for (String line : lines) {
            Matcher degreeMatcher = degreePattern.matcher(line);
            if (degreeMatcher.find() && edu.getDegree() == null) edu.setDegree(line.trim());

            Matcher yearMatcher = yearPattern.matcher(line);
            if (yearMatcher.find() && edu.getYear() == null) edu.setYear(yearMatcher.group());

            Matcher gpaMatcher = gpaPattern.matcher(line);
            if (gpaMatcher.find()) edu.setGpa(gpaMatcher.group(2));

            if (edu.getDegree() != null && edu.getInstitution() == null && !line.trim().equals(edu.getDegree())) {
                edu.setInstitution(line.trim());
            }
        }
        return edu;
    }

    private List<String> checkATSWarnings(String rawText, String cleanedText) {
        List<String> warnings = new ArrayList<>();

        if (rawText.contains("table") || rawText.toLowerCase().contains("<table")) {
            warnings.add("Tables detected — ATS systems often fail to parse table content correctly");
        }
        if (!cleanedText.toLowerCase().contains("experience") && !cleanedText.toLowerCase().contains("employment")) {
            warnings.add("No clear 'Experience' section heading found — ATS may not detect work history");
        }
        if (!cleanedText.toLowerCase().contains("education")) {
            warnings.add("No 'Education' section detected");
        }
        if (cleanedText.split("\\s+").length < 200) {
            warnings.add("Resume appears too short (< 200 words) — may be filtered out by ATS");
        }
        if (cleanedText.split("\\s+").length > 1000) {
            warnings.add("Resume is very long — consider condensing to 1-2 pages");
        }
        Pattern emailPattern = Pattern.compile("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}");
        if (!emailPattern.matcher(rawText).find()) {
            warnings.add("No email address detected — contact info may be in an image or header");
        }
        return warnings;
    }

    private double calculateReadability(String text) {
        String[] sentences = text.split("[.!?]+");
        String[] words = text.split("\\s+");
        if (sentences.length == 0 || words.length == 0) return 0;
        double avgWordsPerSentence = (double) words.length / sentences.length;
        // Simplified Flesch score proxy: penalize very long sentences
        return Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));
    }
}

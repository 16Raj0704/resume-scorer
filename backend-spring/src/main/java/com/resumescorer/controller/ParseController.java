package com.resumescorer.controller;

import com.resumescorer.dto.ParseTextRequest;
import com.resumescorer.dto.ParsedResumeDTO;
import com.resumescorer.service.ResumeParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/parse")
@CrossOrigin(origins = "*")
public class ParseController {

    @Autowired
    private ResumeParserService parserService;

    // Health check
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "parser"));
    }

    // Parse plain text
    @PostMapping("/text")
    public ResponseEntity<ParsedResumeDTO> parseText(@RequestBody ParseTextRequest request) {
        if (request.getText() == null || request.getText().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        ParsedResumeDTO result = parserService.parseText(request.getText());
        return ResponseEntity.ok(result);
    }

    // Parse PDF upload
    @PostMapping("/pdf")
    public ResponseEntity<?> parsePdf(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files accepted"));
        }
        try {
            ParsedResumeDTO result = parserService.parsePdf(file);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "PDF parsing failed: " + e.getMessage()));
        }
    }

    // Extract only bullet points (for rewrite feature)
    @PostMapping("/bullets")
    public ResponseEntity<?> extractBullets(@RequestBody ParseTextRequest request) {
        if (request.getText() == null || request.getText().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "text is required"));
        }
        ParsedResumeDTO parsed = parserService.parseText(request.getText());
        return ResponseEntity.ok(Map.of(
            "bullets", parsed.getBulletPoints(),
            "count", parsed.getBulletPoints().size()
        ));
    }

    // ATS warnings only
    @PostMapping("/ats-check")
    public ResponseEntity<?> atsCheck(@RequestBody ParseTextRequest request) {
        if (request.getText() == null || request.getText().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "text is required"));
        }
        ParsedResumeDTO parsed = parserService.parseText(request.getText());
        return ResponseEntity.ok(Map.of(
            "atsWarnings", parsed.getAtsWarnings(),
            "readabilityScore", parsed.getReadabilityScore(),
            "wordCount", parsed.getWordCount(),
            "skills", parsed.getSkills(),
            "contactInfo", parsed.getContactInfo()
        ));
    }
}

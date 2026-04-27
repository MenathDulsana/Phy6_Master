package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.ChatRequestDTO;
import com.example.Phy6_Master.dto.ChatResponseDTO;
import com.example.Phy6_Master.service.OpenAIService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final OpenAIService openAIService;

    public ChatController(OpenAIService openAIService) {
        this.openAIService = openAIService;
    }

    @PostMapping
    public ResponseEntity<ChatResponseDTO> chat(@Valid @RequestBody ChatRequestDTO request) {
        String response = openAIService.getChatCompletion(request.getMessage());
        return ResponseEntity.ok(new ChatResponseDTO(response));
    }
}

package com.example.Phy6_Master.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.example.Phy6_Master.exception.BadRequestException;
import com.example.Phy6_Master.exception.ExternalServiceException;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class OpenAIService {

    @Value("${openai.api.key:}")
    private String apiKey;

    /** Base URL including /v1, e.g. https://api.openai.com/v1 or https://api.groq.com/openai/v1 */
    @Value("${openai.api.base-url:https://api.openai.com/v1}")
    private String apiBaseUrl;

    @Value("${openai.model:gpt-4o-mini}")
    private String chatModel;

    @Value("${openai.system.prompt:You are a helpful study assistant for Phy6 Master students. Give clear, concise answers related to A/L physics learning support.}")
    private String systemPrompt;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getChatCompletion(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            throw new BadRequestException("Message must not be empty");
        }
        String normalizedApiKey = normalizeApiKey(apiKey);
        if ((normalizedApiKey == null || normalizedApiKey.isBlank()) && !allowsMissingApiKey()) {
            throw new ExternalServiceException(
                    "Chat API key is not configured. For a free cloud option use Groq (see docs/chatbot-free-setup.md): "
                            + "set OPENAI_API_KEY / openai.api.key and openai.api.base-url=https://api.groq.com/openai/v1. "
                            + "For local free inference use Ollama on localhost:11434 with an empty key.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (normalizedApiKey != null && !normalizedApiKey.isBlank()) {
            headers.setBearerAuth(normalizedApiKey);
        }

        String url = chatCompletionsUrl();

        List<Map<String, String>> messages = new ArrayList<>();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }
        messages.add(Map.of("role", "user", "content", userMessage.trim()));

        Map<String, Object> requestBody = Map.of(
            "model", chatModel,
            "messages", messages
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, entity, JsonNode.class);
            JsonNode body = response.getBody();
            if (!response.getStatusCode().is2xxSuccessful() || body == null) {
                throw new ExternalServiceException("Chat service returned an empty response.");
            }

            JsonNode contentNode = body.path("choices").path(0).path("message").path("content");
            if (contentNode.isMissingNode() || contentNode.isNull() || contentNode.asText().isBlank()) {
                throw new ExternalServiceException("Chat service returned an invalid response.");
            }

            return contentNode.asText().trim();
        } catch (HttpStatusCodeException ex) {
            String message;
            if (ex.getStatusCode().value() == 401) {
                message = "Chat API authentication failed (401). Check OPENAI_API_KEY / openai.api.key and openai.api.base-url for your provider.";
            } else {
                String responseBody = ex.getResponseBodyAsString();
                message = "Chat service request failed with status " + ex.getStatusCode().value();
                if (responseBody != null && !responseBody.isBlank()) {
                    message = message + ": " + responseBody;
                }
            }
            throw new ExternalServiceException(message, ex);
        } catch (RestClientException ex) {
            throw new ExternalServiceException("Unable to reach chat service.", ex);
        }
    }

    private String normalizeApiKey(String rawApiKey) {
        if (rawApiKey == null) {
            return null;
        }

        String key = rawApiKey.trim();
        if (key.isEmpty()) {
            return "";
        }

        if ((key.startsWith("\"") && key.endsWith("\"")) || (key.startsWith("'") && key.endsWith("'"))) {
            key = key.substring(1, key.length() - 1).trim();
        }

        if (key.regionMatches(true, 0, "Bearer ", 0, 7)) {
            key = key.substring(7).trim();
        }

        return key;
    }

    /** Ollama's OpenAI-compatible server usually needs no Bearer token on localhost:11434. */
    private boolean allowsMissingApiKey() {
        if (apiBaseUrl == null) {
            return false;
        }
        String u = apiBaseUrl.trim().toLowerCase();
        return u.startsWith("http://localhost:11434") || u.startsWith("http://127.0.0.1:11434");
    }

    private String chatCompletionsUrl() {
        String base = apiBaseUrl == null ? "" : apiBaseUrl.trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/chat/completions";
    }
}

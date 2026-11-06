package com.kalagram.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;

import java.util.List;

/** Workshop detail lists are edited and read as a whole, so they are stored as JSON text. */
public final class JsonConverters {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonConverters() {}

    public record ScheduleDay(String day, String title, String description) {}

    public record Faq(String question, String answer) {}

    private abstract static class JsonListConverter<T> implements AttributeConverter<List<T>, String> {
        private final TypeReference<List<T>> type;

        JsonListConverter(TypeReference<List<T>> type) {
            this.type = type;
        }

        @Override
        public String convertToDatabaseColumn(List<T> value) {
            try {
                return MAPPER.writeValueAsString(value == null ? List.of() : value);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Could not serialise list", e);
            }
        }

        @Override
        public List<T> convertToEntityAttribute(String json) {
            if (json == null || json.isBlank()) {
                return List.of();
            }
            try {
                return MAPPER.readValue(json, type);
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Could not read stored list", e);
            }
        }
    }

    public static class StringList extends JsonListConverter<String> {
        public StringList() {
            super(new TypeReference<>() {});
        }
    }

    public static class ScheduleList extends JsonListConverter<ScheduleDay> {
        public ScheduleList() {
            super(new TypeReference<>() {});
        }
    }

    public static class FaqList extends JsonListConverter<Faq> {
        public FaqList() {
            super(new TypeReference<>() {});
        }
    }
}

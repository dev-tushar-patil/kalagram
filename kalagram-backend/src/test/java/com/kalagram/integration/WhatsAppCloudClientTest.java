package com.kalagram.integration;

import com.kalagram.config.KalagramProperties;
import com.kalagram.dto.Dtos.RegistrationConfirmation;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class WhatsAppCloudClientTest {

    private static KalagramProperties properties(boolean enabled, String token) {
        return new KalagramProperties(List.of(), "uploads", false, 20, null, null, null,
                new KalagramProperties.Whatsapp(enabled, "v23.0", "12345", token, "new_workshop_registration", "en", "+91 90110 59088"));
    }

    private static RegistrationConfirmation registration() {
        return new RegistrationConfirmation("KG-2026-ABC234", "PENDING", "Asha\nPatil", "+919000000000", "asha@example.com",
                "Mud House Building Workshop", LocalDate.of(2027, 1, 5), LocalDate.of(2027, 1, 11), "Batch", 2, null, null);
    }

    @Test
    void postsApprovedTemplateWithCleanParameters() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://graph.facebook.com/v23.0/12345/messages"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-token"))
                .andExpect(jsonPath("$.to").value("919011059088"))
                .andExpect(jsonPath("$.template.name").value("new_workshop_registration"))
                .andExpect(jsonPath("$.template.components[0].parameters.length()").value(8))
                .andExpect(jsonPath("$.template.components[0].parameters[1].text").value("Asha Patil"))
                .andExpect(jsonPath("$.template.components[0].parameters[5].text").value("5 Jan 2027"))
                .andExpect(jsonPath("$.template.components[0].parameters[7].text").value("-"))
                .andRespond(withSuccess());

        new WhatsAppCloudClient(properties(true, "test-token"), builder).sendRegistrationNotification(registration());

        server.verify();
    }

    @Test
    void notConfiguredWithoutTokenOrWhenDisabled() {
        assertThat(new WhatsAppCloudClient(properties(true, ""), RestClient.builder()).isConfigured()).isFalse();
        assertThat(new WhatsAppCloudClient(properties(false, "t"), RestClient.builder()).isConfigured()).isFalse();
        assertThat(new WhatsAppCloudClient(properties(true, "t"), RestClient.builder()).isConfigured()).isTrue();
    }
}

package com.kalagram.integration;

import com.kalagram.config.KalagramProperties;
import com.kalagram.dto.Dtos.RegistrationConfirmation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Runs only after the registration has committed, on a background thread: a WhatsApp or mail outage
 * must never lose a registration or slow the participant's confirmation.
 */
@Component
public class RegistrationNotifier {

    private static final Logger log = LoggerFactory.getLogger(RegistrationNotifier.class);

    private final WhatsAppCloudClient whatsApp;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final KalagramProperties.Mail mail;

    public RegistrationNotifier(WhatsAppCloudClient whatsApp, ObjectProvider<JavaMailSender> mailSender,
                                KalagramProperties properties) {
        this.whatsApp = whatsApp;
        this.mailSender = mailSender;
        this.mail = properties.mail();
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRegistrationCreated(RegistrationCreatedEvent event) {
        RegistrationConfirmation r = event.registration();
        if (whatsApp.isConfigured()) {
            try {
                whatsApp.sendRegistrationNotification(r);
                log.info("WhatsApp notification sent for {}", r.registrationId());
            } catch (RuntimeException e) {
                log.error("WhatsApp notification failed for {}: {}", r.registrationId(), e.getMessage());
            }
        }
        sendEmailConfirmation(r);
    }

    private void sendEmailConfirmation(RegistrationConfirmation r) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (!mail.enabled() || sender == null) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(r.email());
            if (mail.from() != null && !mail.from().isBlank()) {
                message.setFrom(mail.from());
            }
            message.setSubject("Kalagram registration received - " + r.registrationId());
            message.setText("""
                    Hello %s,

                    Thank you for registering with Kalagram. We have received your request and will be in touch to confirm your seat.

                    Registration ID: %s
                    Workshop: %s
                    Dates: %s to %s
                    Participants: %d

                    Status: Pending confirmation

                    Kalagram
                    Seven Elements. One Tradition.
                    """.formatted(r.fullName(), r.registrationId(), r.workshopTitle(), r.startDate(), r.endDate(),
                    r.participants()));
            sender.send(message);
        } catch (RuntimeException e) {
            log.error("Confirmation email failed for {}: {}", r.registrationId(), e.getMessage());
        }
    }
}

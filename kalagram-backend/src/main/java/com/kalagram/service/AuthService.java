package com.kalagram.service;

import com.kalagram.config.KalagramProperties;
import com.kalagram.dto.Dtos.AdminProfile;
import com.kalagram.dto.Dtos.LoginRequest;
import com.kalagram.dto.Dtos.LoginResponse;
import com.kalagram.entity.AdminUser;
import com.kalagram.exception.ApiException;
import com.kalagram.repository.Repositories.AdminUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
public class AuthService {

    private final AdminUserRepository admins;
    private final PasswordEncoder encoder;
    private final JwtEncoder jwtEncoder;
    private final KalagramProperties properties;
    /** Compared against when the email is unknown, so response time doesn't reveal which emails exist. */
    private final String dummyHash;

    public AuthService(AdminUserRepository admins, PasswordEncoder encoder, JwtEncoder jwtEncoder,
                       KalagramProperties properties) {
        this.admins = admins;
        this.encoder = encoder;
        this.jwtEncoder = jwtEncoder;
        this.properties = properties;
        this.dummyHash = encoder.encode("not-a-real-password");
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        AdminUser admin = admins.findByEmailIgnoreCase(request.email().trim()).filter(AdminUser::isActive).orElse(null);
        boolean matches = encoder.matches(request.password(), admin == null ? dummyHash : admin.getPasswordHash());
        if (admin == null || !matches) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Incorrect email or password.");
        }
        Instant now = Instant.now();
        Instant expires = now.plus(Duration.ofHours(properties.jwt().expiryHours()));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("kalagram")
                .subject(admin.getEmail())
                .issuedAt(now)
                .expiresAt(expires)
                .claim("name", admin.getDisplayName())
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new LoginResponse(token, expires, admin.getEmail(), admin.getDisplayName());
    }

    @Transactional(readOnly = true)
    public AdminProfile profile(String email) {
        return admins.findByEmailIgnoreCase(email).filter(AdminUser::isActive)
                .map(a -> new AdminProfile(a.getEmail(), a.getDisplayName()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in again."));
    }
}

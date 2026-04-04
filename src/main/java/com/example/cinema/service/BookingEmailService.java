package com.example.cinema.service;

import com.example.cinema.dto.BookingDto;
import com.example.cinema.dto.ShowtimeDto;
import com.example.cinema.dto.SeatBookingDto;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${app.name:Cinema Management System}")
    private String appName;

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("EEEE, MMMM d yyyy");
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("h:mm a");

    /**
     * Sends a booking confirmation email asynchronously.
     * This method returns immediately; the email is dispatched on a background thread.
     * Called from the controller AFTER the booking transaction has committed.
     */
    @Async
    public void sendBookingConfirmation(BookingDto booking, List<SeatBookingDto> seatBookings) {
        String to = booking.getUser().getEmail();
        String bookingRef = booking.getBookingReference();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Booking Confirmed – " + bookingRef);
            helper.setText(buildHtml(booking, seatBookings), true);
            mailSender.send(message);
            log.info("Booking confirmation email sent to {} for booking {}", to, booking);
        } catch (Exception e) {
            // Email failure must never propagate to the caller — booking is already confirmed.
            log.error("Failed to send booking confirmation email for booking {}: {}",
                    bookingRef, e.getMessage(), e);
        }
    }

    // -------------------------------------------------------------------------
    // HTML template
    // -------------------------------------------------------------------------

    private String buildHtml(BookingDto booking, List<SeatBookingDto> seatBookings) {
        ShowtimeDto showtime = booking.getShowtime();

        String date = showtime != null && showtime.getShowDatetime() != null
                ? showtime.getShowDatetime().format(DATE_FORMATTER) : "—";
        String time = showtime != null && showtime.getShowDatetime() != null
                ? showtime.getShowDatetime().format(TIME_FORMATTER) : "—";
        String movieTitle  = showtime != null ? showtime.getMovieTitle()  : "—";
        String theaterName = showtime != null ? showtime.getTheaterName() : "—";

        String seatRows = seatBookings.stream()
                .map(s -> "<tr>" +
                        "<td style='padding:6px 12px;border-bottom:1px solid #2d2d2d;color:#d1d5db;'>" + s.getSeatLabel() + "</td>" +
                        "<td style='padding:6px 12px;border-bottom:1px solid #2d2d2d;color:#d1d5db;text-align:right;'>" + formatType(s.getSeatType()) + "</td>" +
                        "</tr>")
                .collect(Collectors.joining());

        String totalAmount = booking.getTotalAmount() != null
                ? "$" + booking.getTotalAmount().setScale(2, java.math.RoundingMode.HALF_UP)
                : "—";

        String userName = booking.getUser() != null ? booking.getUser().getFullName() : "Customer";

        return "<!DOCTYPE html>" +
                "<html lang='en'><head><meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
                "<title>Booking Confirmed</title></head>" +
                "<body style='margin:0;padding:0;background-color:#030712;font-family:Arial,Helvetica,sans-serif;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#030712;'><tr><td align='center' style='padding:32px 16px;'>" +

                // Card
                "<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;background-color:#111827;border-radius:12px;overflow:hidden;'>" +

                // Header
                "<tr><td style='background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 40px;text-align:center;'>" +
                "<p style='margin:0 0 4px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#e9d5ff;'>Booking Confirmed</p>" +
                "<h1 style='margin:0;font-size:28px;font-weight:700;color:#ffffff;'>" + appName + "</h1>" +
                "</td></tr>" +

                // Greeting
                "<tr><td style='padding:32px 40px 0;'>" +
                "<p style='margin:0;font-size:16px;color:#d1d5db;'>Hi <strong style='color:#ffffff;'>" + escapeHtml(userName) + "</strong>,</p>" +
                "<p style='margin:8px 0 0;font-size:14px;color:#9ca3af;'>Your seats are reserved. Here's a summary of your booking.</p>" +
                "</td></tr>" +

                // Reference badge
                "<tr><td style='padding:24px 40px 0;'>" +
                "<div style='background-color:#1f2937;border:1px solid #374151;border-radius:8px;padding:16px 20px;text-align:center;'>" +
                "<p style='margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b7280;'>Booking Reference</p>" +
                "<p style='margin:0;font-size:22px;font-weight:700;color:#a855f7;letter-spacing:2px;'>" + escapeHtml(booking.getBookingReference()) + "</p>" +
                "</div></td></tr>" +

                // Movie details
                "<tr><td style='padding:24px 40px 0;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0'>" +
                detailRow("Movie",   escapeHtml(movieTitle)) +
                detailRow("Theater", escapeHtml(theaterName)) +
                detailRow("Date",    escapeHtml(date)) +
                detailRow("Time",    escapeHtml(time)) +
                "</table></td></tr>" +

                // Seats table
                "<tr><td style='padding:24px 40px 0;'>" +
                "<p style='margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6b7280;'>Your Seats</p>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #1f2937;border-radius:8px;overflow:hidden;'>" +
                "<thead><tr style='background-color:#1f2937;'>" +
                "<th style='padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;'>Seat</th>" +
                "<th style='padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;'>Type</th>" +
                "</tr></thead>" +
                "<tbody>" + seatRows + "</tbody>" +
                "</table></td></tr>" +

                // Total
                "<tr><td style='padding:24px 40px;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='border-top:1px solid #1f2937;padding-top:16px;'>" +
                "<tr>" +
                "<td style='font-size:14px;color:#9ca3af;'>Total Paid</td>" +
                "<td style='text-align:right;font-size:20px;font-weight:700;color:#a855f7;'>" + totalAmount + "</td>" +
                "</tr></table></td></tr>" +

                // Footer
                "<tr><td style='background-color:#0f172a;padding:24px 40px;text-align:center;border-top:1px solid #1f2937;'>" +
                "<p style='margin:0;font-size:12px;color:#4b5563;'>This email was sent by " + escapeHtml(appName) + ".</p>" +
                "<p style='margin:4px 0 0;font-size:12px;color:#4b5563;'>If you have questions, please contact support.</p>" +
                "</td></tr>" +

                "</table>" + // end card
                "</td></tr></table>" + // end outer table
                "</body></html>";
    }

    private static String detailRow(String label, String value) {
        return "<tr>" +
                "<td style='padding:8px 0;font-size:13px;color:#6b7280;width:120px;vertical-align:top;'>" + label + "</td>" +
                "<td style='padding:8px 0;font-size:14px;color:#f3f4f6;font-weight:500;'>" + value + "</td>" +
                "</tr>";
    }

    private static String formatType(String seatType) {
        if (seatType == null) return "Standard";
        return switch (seatType.toUpperCase()) {
            case "VIP"     -> "VIP";
            case "PREMIUM" -> "Premium";
            default        -> "Standard";
        };
    }

    private static String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;");
    }
}

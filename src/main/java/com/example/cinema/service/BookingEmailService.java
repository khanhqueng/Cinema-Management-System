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
                        "<td style='padding:8px 14px;border-bottom:1px solid #2a0e0e;color:#e5e7eb;font-size:14px;'>" + s.getSeatLabel() + "</td>" +
                        "<td style='padding:8px 14px;border-bottom:1px solid #2a0e0e;color:#e5e7eb;font-size:14px;text-align:right;'>" + formatType(s.getSeatType()) + "</td>" +
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
                "<body style='margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#0a0a0a;'><tr><td align='center' style='padding:36px 16px;'>" +

                // Card
                "<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;background-color:#141414;border-radius:14px;overflow:hidden;border:1px solid #2a0e0e;'>" +

                // Header
                "<tr><td style='background:linear-gradient(135deg,#7f1d1d 0%,#b91c1c 50%,#ef4444 100%);padding:36px 40px;text-align:center;'>" +
                "<p style='margin:0 0 6px 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#fecaca;opacity:0.85;'>&#127916; Booking Confirmed</p>" +
                "<h1 style='margin:0;font-size:30px;font-weight:800;color:#ffffff;letter-spacing:1px;text-shadow:0 2px 8px rgba(0,0,0,0.4);'>" + appName + "</h1>" +
                "</td></tr>" +

                // Divider accent line
                "<tr><td style='height:3px;background:linear-gradient(90deg,#7f1d1d,#ef4444,#7f1d1d);'></td></tr>" +

                // Greeting
                "<tr><td style='padding:32px 40px 0;'>" +
                "<p style='margin:0;font-size:16px;color:#d1d5db;line-height:1.5;'>Hi <strong style='color:#ffffff;'>" + escapeHtml(userName) + "</strong> &#127881;,</p>" +
                "<p style='margin:8px 0 0;font-size:14px;color:#9ca3af;line-height:1.6;'>Your seats are reserved &amp; confirmed. Here&apos;s a summary of your booking.</p>" +
                "</td></tr>" +

                // Reference badge
                "<tr><td style='padding:24px 40px 0;'>" +
                "<div style='background:linear-gradient(135deg,#1a0505,#200808);border:1px solid #7f1d1d;border-radius:10px;padding:18px 20px;text-align:center;'>" +
                "<p style='margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ef4444;'>Booking Reference</p>" +
                "<p style='margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:4px;'>" + escapeHtml(booking.getBookingReference()) + "</p>" +
                "</div></td></tr>" +

                // Movie details
                "<tr><td style='padding:24px 40px 0;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#1a0505;border-radius:10px;border:1px solid #2a0e0e;'>" +
                "<tr><td style='padding:12px 18px 0;' colspan='2'>" +
                "<p style='margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ef4444;'>Movie Info</p>" +
                "</td></tr>" +
                detailRow("Movie",   escapeHtml(movieTitle)) +
                detailRow("Theater", escapeHtml(theaterName)) +
                detailRow("Date",    escapeHtml(date)) +
                detailRow("Time",    escapeHtml(time)) +
                "<tr><td style='padding:4px 0;' colspan='2'></td></tr>" +
                "</table></td></tr>" +

                // Seats table
                "<tr><td style='padding:24px 40px 0;'>" +
                "<p style='margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ef4444;'>Your Seats</p>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #2a0e0e;border-radius:10px;overflow:hidden;'>" +
                "<thead><tr style='background:linear-gradient(90deg,#1f0707,#2a0a0a);'>" +
                "<th style='padding:10px 14px;text-align:left;font-size:11px;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;'>Seat</th>" +
                "<th style='padding:10px 14px;text-align:right;font-size:11px;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;'>Type</th>" +
                "</tr></thead>" +
                "<tbody>" + seatRows + "</tbody>" +
                "</table></td></tr>" +

                // Total
                "<tr><td style='padding:24px 40px 28px;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='border-top:1px solid #2a0e0e;padding-top:18px;'>" +
                "<tr>" +
                "<td style='font-size:14px;color:#9ca3af;padding-top:16px;'>Total Paid</td>" +
                "<td style='text-align:right;padding-top:16px;'>" +
                "<span style='font-size:22px;font-weight:800;background:linear-gradient(90deg,#ef4444,#fca5a5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#ef4444;'>" + totalAmount + "</span>" +
                "</td>" +
                "</tr></table></td></tr>" +

                // Footer
                "<tr><td style='background:linear-gradient(180deg,#120404,#0a0a0a);padding:24px 40px;text-align:center;border-top:1px solid #2a0e0e;'>" +
                "<p style='margin:0;font-size:12px;color:#6b7280;'>This email was sent by <span style='color:#ef4444;'>" + escapeHtml(appName) + "</span>.</p>" +
                "<p style='margin:6px 0 0;font-size:12px;color:#6b7280;'>If you have any questions, please contact our support team.</p>" +
                "</td></tr>" +

                "</table>" + // end card
                "</td></tr></table>" + // end outer table
                "</body></html>";
    }

    private static String detailRow(String label, String value) {
        return "<tr>" +
                "<td style='padding:8px 18px;font-size:13px;color:#9ca3af;width:110px;vertical-align:top;'>" + label + "</td>" +
                "<td style='padding:8px 18px 8px 0;font-size:14px;color:#f9fafb;font-weight:600;'>" + value + "</td>" +
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

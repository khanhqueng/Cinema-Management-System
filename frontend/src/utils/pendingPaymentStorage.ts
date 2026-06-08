import { Showtime } from "../types";
import { bookingService } from "../services/bookingService";

export interface PendingPaymentEntry {
  showtimeId: number;
  selectedSeats: number[];
  totalPrice: number;
  showtime: Showtime;
  reservedUntil: number;
}

const PENDING_PAYMENTS_KEY = "pendingPayments";
const LEGACY_PENDING_PAYMENT_KEY = "pendingPayment";

function normalizeEntry(value: any): PendingPaymentEntry | null {
  if (!value) return null;

  const showtimeId = Number(value.showtimeId);
  const reservedUntil = Number(value.reservedUntil);

  if (!Number.isFinite(showtimeId) || !Number.isFinite(reservedUntil)) {
    return null;
  }

  if (!Array.isArray(value.selectedSeats) || !value.showtime) {
    return null;
  }

  return {
    showtimeId,
    selectedSeats: value.selectedSeats,
    totalPrice: Number(value.totalPrice) || 0,
    showtime: value.showtime,
    reservedUntil,
  };
}

export function getPendingPaymentEntries(): PendingPaymentEntry[] {
  const raw = localStorage.getItem(PENDING_PAYMENTS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      return entries.map(normalizeEntry).filter(Boolean) as PendingPaymentEntry[];
    } catch {
      localStorage.removeItem(PENDING_PAYMENTS_KEY);
    }
  }

  const legacyRaw = localStorage.getItem(LEGACY_PENDING_PAYMENT_KEY);
  if (!legacyRaw) return [];

  try {
    const legacyEntry = normalizeEntry(JSON.parse(legacyRaw));
    if (!legacyEntry) return [];

    localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify([legacyEntry]));
    localStorage.removeItem(LEGACY_PENDING_PAYMENT_KEY);
    return [legacyEntry];
  } catch {
    localStorage.removeItem(LEGACY_PENDING_PAYMENT_KEY);
    return [];
  }
}

export function getPendingPaymentForShowtime(
  showtimeId: number,
): PendingPaymentEntry | null {
  return (
    getPendingPaymentEntries().find((entry) => entry.showtimeId === showtimeId) ||
    null
  );
}

export function savePendingPayment(entry: PendingPaymentEntry): void {
  const entries = getPendingPaymentEntries().filter(
    (current) => current.showtimeId !== entry.showtimeId,
  );

  entries.push(entry);
  localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(entries));
  localStorage.removeItem(LEGACY_PENDING_PAYMENT_KEY);
}

export function removePendingPaymentForShowtime(showtimeId: number): void {
  const entries = getPendingPaymentEntries().filter(
    (entry) => entry.showtimeId !== showtimeId,
  );

  if (entries.length === 0) {
    localStorage.removeItem(PENDING_PAYMENTS_KEY);
  } else {
    localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(entries));
  }
}

export async function syncPendingPaymentForShowtime(
  showtimeId: number,
): Promise<PendingPaymentEntry | null> {
  const pendingEntry = getPendingPaymentForShowtime(showtimeId);
  if (!pendingEntry) {
    return null;
  }

  try {
    const status = await bookingService.getSeatLockStatus(
      pendingEntry.showtimeId,
      pendingEntry.selectedSeats,
    );

    if (status.locked && status.remainingMs > 0) {
      const updatedEntry: PendingPaymentEntry = {
        ...pendingEntry,
        selectedSeats:
          status.seatIds && status.seatIds.length > 0
            ? status.seatIds
            : pendingEntry.selectedSeats,
        reservedUntil: Date.now() + status.remainingMs,
      };
      savePendingPayment(updatedEntry);
      return updatedEntry;
    }

    removePendingPaymentForShowtime(showtimeId);
    return null;
  } catch {
    if (pendingEntry.reservedUntil > Date.now()) {
      return pendingEntry;
    }

    removePendingPaymentForShowtime(showtimeId);
    return null;
  }
}
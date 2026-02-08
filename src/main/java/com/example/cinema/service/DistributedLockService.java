package com.example.cinema.service;

import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * Service for distributed locking using Redis/Redisson
 */
@Service
@Slf4j
public class DistributedLockService {

    private final RedissonClient redissonClient;
    private final RedisTemplate<String, Object> redisTemplate;

    // Lock configuration constants
    private static final int DEFAULT_WAIT_TIME = 10; // seconds
    private static final int DEFAULT_LEASE_TIME = 30; // seconds
    private static final String SEAT_LOCK_PREFIX = "seat_lock:";
    private static final String BOOKING_LOCK_PREFIX = "booking_lock:";

    @Autowired
    public DistributedLockService(RedissonClient redissonClient, RedisTemplate<String, Object> redisTemplate) {
        this.redissonClient = redissonClient;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Execute a function with distributed lock
     *
     * @param lockKey The key for the lock
     * @param waitTime Maximum time to wait for the lock (in seconds)
     * @param leaseTime Maximum time to hold the lock (in seconds)
     * @param task The task to execute while holding the lock
     * @return The result of the task execution
     * @throws RuntimeException if lock cannot be acquired or task execution fails
     */
    public <T> T executeWithLock(String lockKey, int waitTime, int leaseTime, Supplier<T> task) {
        RLock lock = redissonClient.getLock(lockKey);

        try {
            // Try to acquire the lock
            boolean acquired = lock.tryLock(waitTime, leaseTime, TimeUnit.SECONDS);

            if (!acquired) {
                log.warn("Failed to acquire lock for key: {}", lockKey);
                throw new RuntimeException("Unable to acquire lock for key: " + lockKey);
            }

            log.debug("Lock acquired for key: {}", lockKey);

            // Execute the task while holding the lock
            return task.get();

        } catch (InterruptedException e) {
            log.error("Thread interrupted while waiting for lock: {}", lockKey, e);
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while waiting for lock", e);
        } catch (Exception e) {
            log.error("Error occurred while executing task with lock: {}", lockKey, e);
            throw new RuntimeException("Error executing task with lock", e);
        } finally {
            // Always release the lock if it's held by current thread
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
                log.debug("Lock released for key: {}", lockKey);
            }
        }
    }

    /**
     * Execute a function with distributed lock using default timeouts
     *
     * @param lockKey The key for the lock
     * @param task The task to execute while holding the lock
     * @return The result of the task execution
     */
    public <T> T executeWithLock(String lockKey, Supplier<T> task) {
        return executeWithLock(lockKey, DEFAULT_WAIT_TIME, DEFAULT_LEASE_TIME, task);
    }

    /**
     * Execute a void function with distributed lock
     *
     * @param lockKey The key for the lock
     * @param waitTime Maximum time to wait for the lock (in seconds)
     * @param leaseTime Maximum time to hold the lock (in seconds)
     * @param task The task to execute while holding the lock
     */
    public void executeWithLock(String lockKey, int waitTime, int leaseTime, Runnable task) {
        executeWithLock(lockKey, waitTime, leaseTime, () -> {
            task.run();
            return null;
        });
    }

    /**
     * Execute a void function with distributed lock using default timeouts
     *
     * @param lockKey The key for the lock
     * @param task The task to execute while holding the lock
     */
    public void executeWithLock(String lockKey, Runnable task) {
        executeWithLock(lockKey, DEFAULT_WAIT_TIME, DEFAULT_LEASE_TIME, task);
    }

    /**
     * Try to acquire a seat lock for reservation using Redis SET IF NOT EXISTS (atomic)
     *
     * @param showtimeId The showtime ID
     * @param seatId The seat ID
     * @param userId The user ID attempting to reserve
     * @param leaseTime Lock expiration time in seconds
     * @return true if lock was acquired, false otherwise
     */
    public boolean tryAcquireSeatLock(Long showtimeId, Long seatId, Long userId, int leaseTime) {
        String lockKey = getSeatLockKey(showtimeId, seatId);
        String lockValue = userId + ":" + System.currentTimeMillis();

        try {
            // Use Redis SET IF NOT EXISTS with TTL - atomic operation
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(
                lockKey,
                lockValue,
                Duration.ofSeconds(leaseTime)
            );

            boolean success = Boolean.TRUE.equals(acquired);

            if (success) {
                log.info("✅ Seat lock acquired: showtime={}, seat={}, user={}", showtimeId, seatId, userId);
            } else {
                log.warn("❌ Failed to acquire seat lock (already taken): showtime={}, seat={}, user={}",
                         showtimeId, seatId, userId);
            }

            return success;

        } catch (Exception e) {
            log.error("Error while trying to acquire seat lock: showtime={}, seat={}, user={}",
                    showtimeId, seatId, userId, e);
            return false;
        }
    }

    /**
     * Release a seat lock using Redis DELETE
     *
     * @param showtimeId The showtime ID
     * @param seatId The seat ID
     * @param userId The user ID that holds the lock
     */
    public void releaseSeatLock(Long showtimeId, Long seatId, Long userId) {
        String lockKey = getSeatLockKey(showtimeId, seatId);

        try {
            Boolean deleted = redisTemplate.delete(lockKey);

            if (Boolean.TRUE.equals(deleted)) {
                log.info("✅ Seat lock released: showtime={}, seat={}, user={}", showtimeId, seatId, userId);
            } else {
                log.warn("⚠️ Seat lock was already released or expired: showtime={}, seat={}, user={}",
                         showtimeId, seatId, userId);
            }

        } catch (Exception e) {
            log.error("Error while releasing seat lock: showtime={}, seat={}, user={}",
                    showtimeId, seatId, userId, e);
        }
    }

    /**
     * Check if a seat is currently locked using Redis EXISTS
     *
     * @param showtimeId The showtime ID
     * @param seatId The seat ID
     * @return true if the seat is locked, false otherwise
     */
    public boolean isSeatLocked(Long showtimeId, Long seatId) {
        String lockKey = getSeatLockKey(showtimeId, seatId);

        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(lockKey));
        } catch (Exception e) {
            log.error("Error while checking seat lock status: showtime={}, seat={}",
                    showtimeId, seatId, e);
            return false; // Default to unlocked if error
        }
    }

    /**
     * Execute booking operation with distributed lock for the entire booking process
     *
     * @param userId The user ID
     * @param showtimeId The showtime ID
     * @param task The booking task to execute
     * @return The result of the booking operation
     */
    public <T> T executeBookingWithLock(Long userId, Long showtimeId, Supplier<T> task) {
        String lockKey = getBookingLockKey(userId, showtimeId);
        return executeWithLock(lockKey, 15, 60, task); // Longer timeout for booking process
    }

    /**
     * Generate seat lock key
     */
    private String getSeatLockKey(Long showtimeId, Long seatId) {
        return SEAT_LOCK_PREFIX + showtimeId + ":" + seatId;
    }

    /**
     * Generate booking lock key
     */
    private String getBookingLockKey(Long userId, Long showtimeId) {
        return BOOKING_LOCK_PREFIX + userId + ":" + showtimeId;
    }

    /**
     * Force unlock a seat (admin operation or cleanup)
     *
     * @param showtimeId The showtime ID
     * @param seatId The seat ID
     */
    public void forceUnlockSeat(Long showtimeId, Long seatId) {
        String lockKey = getSeatLockKey(showtimeId, seatId);
        RLock lock = redissonClient.getLock(lockKey);

        if (lock.isLocked()) {
            lock.forceUnlock();
            log.warn("Force unlocked seat: showtime={}, seat={}", showtimeId, seatId);
        }
    }
}
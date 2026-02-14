/**
 * Utility functions for formatting data
 */

/**
 * Format duration from minutes to readable format
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return 'N/A';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

/**
 * Format price in VND currency
 */
export const formatPrice = (price: number): string => {
  if (!price || price <= 0) return 'Free';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Format date to readable format
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Format date and time to readable format
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Format number with commas as thousands separator
 */
export const formatNumber = (num: number): string => {
  if (!num) return '0';

  return num.toLocaleString();
};

/**
 * Format rating to one decimal place
 */
export const formatRating = (rating: number): string => {
  if (!rating) return '0.0';

  return rating.toFixed(1);
};
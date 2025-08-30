import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Utility functions for data formatting and display
 */

/**
 * Format a number as USD currency
 */
export function formatUSD(amount: number): string {
  if (amount === 0) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a number as USD currency with compact notation for large numbers
 */
export function formatUSDCompact(amount: number): string {
  if (amount === 0) return '$0.00';
  
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  
  return formatUSD(amount);
}

/**
 * Format a token amount with symbol
 */
export function formatToken(amount: number, symbol: string = 'APT', decimals: number = 6): string {
  if (amount === 0) return `0 ${symbol}`;
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(amount);
  
  return `${formattedAmount} ${symbol}`;
}

/**
 * Truncate a wallet address for display
 */
export function truncateAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!address || address.length < startLength + endLength + 3) {
    return address;
  }
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateObj);
  }
}

/**
 * Format a number with appropriate suffix (K, M, B)
 */
export function formatNumberCompact(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toString();
}

/**
 * Get a color for a specific wallet index
 */
export function getWalletColor(index: number): string {
  const colors = [
    '#2563eb', // Blue
    '#7c3aed', // Purple
    '#dc2626', // Red
    '#059669', // Green
    '#ea580c', // Orange
    '#be185d', // Pink
    '#0891b2', // Cyan
    '#65a30d', // Lime
    '#9333ea', // Violet
    '#c2410c'  // Amber
  ];
  
  return colors[index % colors.length];
}

/**
 * Calculate the percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format a percentage change with appropriate sign and color
 */
export function formatPercentageChange(change: number): {
  text: string;
  isPositive: boolean;
  color: string;
} {
  const isPositive = change >= 0;
  const sign = isPositive ? '+' : '';
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  
  return {
    text: `${sign}${change.toFixed(1)}%`,
    isPositive,
    color
  };
}

/**
 * Validate if a string is a valid Aptos address
 */
export function isValidAptosAddress(address: string): boolean {
  // Aptos addresses are 64 characters long and start with 0x
  const aptosAddressRegex = /^0x[a-fA-F0-9]{62}$/;
  return aptosAddressRegex.test(address);
}

/**
 * Generate a random mock balance for testing
 */
export function generateMockBalance(): number {
  return Math.random() * 10000 + 100; // $100 to $10,100
}

/**
 * Generate a random mock transaction count for testing
 */
export function generateMockTransactionCount(): number {
  return Math.floor(Math.random() * 1000) + 1; // 1 to 1000
}

/**
 * Generate a random mock volume for testing
 */
export function generateMockVolume(): number {
  return Math.random() * 50000 + 1000; // $1,000 to $51,000
}

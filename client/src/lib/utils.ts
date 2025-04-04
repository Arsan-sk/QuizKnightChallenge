import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats seconds into a MM:SS string format
 * @param seconds - The number of seconds to format
 * @returns Formatted time string (MM:SS)
 */
export function formatTimeTaken(seconds: number | null | undefined): string {
  // Return "0:00" for invalid inputs
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return "0:00";
  }

  // Ensure it's an integer
  const totalSeconds = Math.floor(seconds);
  
  // Calculate minutes and remaining seconds
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  // Format with leading zeros for seconds
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

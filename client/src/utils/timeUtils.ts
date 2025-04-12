/**
 * Extracts time information from a status message.
 * @param text The status message to extract time from
 * @returns The extracted time string (e.g., "12.3s") or null if none found
 */
export const extractTimeFromStatus = (text: string): string | null => {
    if (!text) return null;

    // Server sends messages in formats like: 
    // "Color themes generated - 147.7s" or "Total: 147.7s"
    // Let's match numbers followed by 's' at the end of a segment
    const timePattern = /(\d+\.\d+)s/;
    const match = text.match(timePattern);

    if (match && match[1]) {
        return `${match[1]}s`;
    }

    return null;
};

/**
 * Removes timing information from a status message for cleaner display.
 * @param text The status message to clean
 * @returns The cleaned status message without timing information
 */
export const getCleanStatus = (text: string): string => {
    if (!text) return "";

    // Clean different formats of time reporting:
    // "Color themes generated - 147.7s"
    // "Brand identity complete - Total: 147.7s"
    return text
        .replace(/\s+-\s+\d+\.\d+s$/, '') // Pattern: " - 147.7s" at end of string
        .replace(/\s+-\s+Total:\s+\d+\.\d+s$/, '') // Pattern: " - Total: 147.7s" at end
        .replace(/:\s+\d+\.\d+s$/, '') // Pattern: ": 147.7s" at end of string
        .trim();
};

/**
 * Formats a time value (in seconds) to a consistent string format.
 * @param seconds The time in seconds
 * @returns Formatted time string (e.g., "12.3s")
 */
export const formatTime = (seconds: number): string => {
    return `${seconds.toFixed(1)}s`;
}; 
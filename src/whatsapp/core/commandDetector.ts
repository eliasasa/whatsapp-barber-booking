export function detectCommand(message: string): string | null {
    const normalized = message.trim().toLowerCase();

    if (normalized.startsWith("#")) {
        return normalized;
    }

    return null;
}

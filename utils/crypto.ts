/**
 * Hash a password using SHA-256 via the Web Crypto API.
 * Returns a hex string. Used for offline local-auth only.
 * Backend auth uses bcrypt via the NestJS API.
 */
export async function hashPassword(password: string): Promise<string> {
    const encoded = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

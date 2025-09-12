import { JwtPayload } from "./types";

// Client-side JWT decoder (browser-compatible)
function decodeJWTPayload(token: string): JwtPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed for base64 decoding
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);

    // Decode base64
    const decodedPayload = atob(
      paddedPayload.replace(/-/g, "+").replace(/_/g, "/")
    );

    // Parse JSON
    return JSON.parse(decodedPayload) as JwtPayload;
  } catch {
    return null;
  }
}

// Client-side authentication utilities
export class ClientAuthUtils {
  static readonly TOKEN_KEY = "cloudcanvas_auth_token";

  static setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  static removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = decodeJWTPayload(token);
      if (!decoded || !decoded.exp) return false;

      // Check if token is expired
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  }

  static getCurrentUser(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return decodeJWTPayload(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  // Create Authorization header for API requests
  static getAuthHeaders(): { Authorization?: string } {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

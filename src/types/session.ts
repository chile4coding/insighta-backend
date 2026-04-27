import "express-session";

declare module "express-session" {
  interface SessionData {
    pkceData?: {
      state: string;
      codeVerifier: string;
      timestamp: number;
      redirectUri?: string | null;
    };
    userId?: string;
    role?: string;
  }
}

export {};

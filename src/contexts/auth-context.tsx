"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ClientAuthUtils } from "@/lib/auth-client";
import { JwtPayload, LoginRequest, AuthResponse } from "@/lib/types";

interface AuthContextType {
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    credentials: LoginRequest
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = () => {
      try {
        if (ClientAuthUtils.isAuthenticated()) {
          const currentUser = ClientAuthUtils.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear invalid token
        ClientAuthUtils.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (
    credentials: LoginRequest
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const authData: AuthResponse = result.data;

        // Store token
        ClientAuthUtils.setToken(authData.token);

        // Update user state
        const userPayload = ClientAuthUtils.getCurrentUser();
        setUser(userPayload);

        return { success: true };
      } else {
        return { success: false, error: result.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    ClientAuthUtils.removeToken();
    setUser(null);

    // Optional: Call logout endpoint
    fetch("/api/auth/logout", { method: "POST" }).catch(console.error);
  };

  const refreshUser = () => {
    const currentUser = ClientAuthUtils.getCurrentUser();
    setUser(currentUser);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

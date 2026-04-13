"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { REGISTRATION_ENABLED } from "@/lib/feature-flags";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register } = useAuth();

  const resetForm = () => {
    setEmail("");
    setName("");
    setPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result =
        mode === "login"
          ? await login({ email, password })
          : await register({ email, name, password });

      if (result.success) {
        onOpenChange(false);
        resetForm();
      } else {
        setError(
          result.error || (mode === "login" ? "Login failed" : "Signup failed")
        );
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        resetForm();
        setMode("login");
      }
    }
  };

  const isRegister = mode === "register";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRegister ? (
              <UserPlus className="h-5 w-5" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
            {isRegister ? "Create an Account" : "Sign In to Cloud Canvas"}
          </DialogTitle>
          <DialogDescription>
            {isRegister
              ? "Sign up for a new Cloud Canvas account."
              : "Enter your credentials to access your account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isRegister && (
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@cloudcanvas.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={
                  isRegister
                    ? "At least 8 characters"
                    : "Enter your password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                minLength={isRegister ? 8 : undefined}
                required
              />
            </div>

            {REGISTRATION_ENABLED && (
              <button
                type="button"
                onClick={() => {
                  setMode(isRegister ? "login" : "register");
                  setError(null);
                }}
                disabled={isLoading}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 text-left"
              >
                {isRegister
                  ? "Already have an account? Sign in"
                  : "Need an account? Sign up"}
              </button>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRegister ? "Sign Up" : "Sign In"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

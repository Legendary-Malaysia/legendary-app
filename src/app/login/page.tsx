"use client";

import { useState, useTransition } from "react";
import { login, signup } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    error?: string;
    message?: string;
  } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setResult(null);
    startTransition(async () => {
      const action = mode === "login" ? login : signup;
      const res = await action(formData);
      setResult(res || null);

      if (res?.error) {
        toast.error(res.error);
      } else if (res?.message) {
        toast.success(res.message);
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -right-1/4 -bottom-1/4 h-1/2 w-1/2 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          {/* Logo */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <span className="text-xl font-bold text-white">L</span>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {mode === "login"
              ? "Enter your credentials to access your account"
              : "Enter your details to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-slate-300"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-slate-300"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 font-medium text-white hover:from-indigo-600 hover:to-purple-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setResult(null);
              }}
              className="text-sm text-slate-400 transition-colors hover:text-indigo-400"
            >
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <span className="font-medium text-indigo-400">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span className="font-medium text-indigo-400">Sign in</span>
                </>
              )}
            </button>
          </div>

          {result && (
            <div
              className={`mt-4 rounded-lg p-3 text-sm ${result.error ? "border border-red-500/20 bg-red-500/10 text-red-400" : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"}`}
            >
              <div className="flex items-center gap-2">
                {result.error ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
                <p>{result.error || result.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

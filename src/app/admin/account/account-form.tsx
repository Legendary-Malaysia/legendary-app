"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { type User } from "@supabase/supabase-js";
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
import { Loader2, User as UserIcon, Mail, LogOut } from "lucide-react";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

export default function AccountForm({
  user,
  profile: initialProfile,
  role,
}: {
  user: User;
  profile: Profile | null;
  role: string | null;
}) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [fullname, setFullname] = useState(initialProfile?.full_name ?? "");

  function handleUpdateProfile() {
    startTransition(async () => {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullname || null,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        toast.error("Failed to update profile");
        console.error(error);
      } else {
        toast.success("Profile updated successfully!");
      }
    });
  }

  return (
    <div className="flex items-center justify-center">
      <Card className="relative w-full max-w-md border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          {/* Avatar */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
            <span className="text-3xl font-bold text-white">
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Your Account
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email (read-only) */}
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
                type="email"
                value={user.email ?? ""}
                disabled
                className="border-slate-700 bg-slate-800/30 pl-10 text-slate-400"
              />
            </div>
          </div>

          {/* Role (read-only) */}
          <div className="space-y-2">
            <Label
              htmlFor="role"
              className="text-slate-300"
            >
              Role
            </Label>
            <div className="relative">
              <UserIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="role"
                type="text"
                value={role ?? ""}
                disabled
                className="border-slate-700 bg-slate-800/30 pl-10 text-slate-400"
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="text-slate-300"
            >
              Full Name
            </Label>
            <div className="relative">
              <UserIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="fullName"
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="John Doe"
                className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Update Button */}
          <Button
            onClick={handleUpdateProfile}
            disabled={isPending}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 font-medium text-white hover:from-indigo-600 hover:to-purple-700"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Profile"
            )}
          </Button>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-slate-700/50 pt-4">
            <form
              action="/auth/signout"
              method="post"
            >
              <button
                type="submit"
                className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

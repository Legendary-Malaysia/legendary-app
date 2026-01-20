import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex items-center justify-center">
      <Card className="relative w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="flex flex-col items-center text-center">
          {/* Avatar Skeleton */}
          <Skeleton className="mb-4 h-20 w-20 rounded-full bg-slate-800" />

          {/* Title Skeleton */}
          <Skeleton className="mb-2 h-8 w-48 bg-slate-800" />

          {/* Description Skeleton */}
          <Skeleton className="h-4 w-64 bg-slate-800" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12 bg-slate-800" />
            <Skeleton className="h-10 w-full bg-slate-800" />
          </div>

          {/* Role Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-10 bg-slate-800" />
            <Skeleton className="h-10 w-full bg-slate-800" />
          </div>

          {/* Full Name Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-slate-800" />
            <Skeleton className="h-10 w-full bg-slate-800" />
          </div>

          {/* Update Button Skeleton */}
          <Skeleton className="mb-6 h-10 w-full bg-slate-800" />

          {/* Change Password Section */}
          <div className="space-y-4 border-t border-slate-700/50 pt-4">
            <Skeleton className="h-6 w-40 bg-slate-800" />

            {/* Current Password */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-800" />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-800" />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-800" />
            </div>

            {/* Update Password Button */}
            <Skeleton className="mb-6 h-10 w-full bg-slate-800" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

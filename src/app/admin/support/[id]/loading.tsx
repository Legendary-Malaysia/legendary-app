import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        {/* Back Button Skeleton */}
        <Skeleton className="h-9 w-9 rounded-lg bg-slate-700" />
        {/* Title Skeleton */}
        <Skeleton className="h-8 w-48 bg-slate-700" />
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
        <div className="space-y-6">
          {/* Customer Info Section */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40 bg-slate-700" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-slate-700" />
              <Skeleton className="h-10 w-full bg-slate-700" />
            </div>
          </div>

          <div className="h-px bg-slate-700/50" />

          {/* Ticket Info Section */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 bg-slate-700" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-16 bg-slate-700" />
              <Skeleton className="h-10 w-full bg-slate-700" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-16 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-slate-700" />
              <Skeleton className="h-32 w-full bg-slate-700" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Skeleton className="h-10 w-20 bg-slate-700" />
            <Skeleton className="h-10 w-32 bg-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

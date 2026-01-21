import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="mb-2 h-9 w-64 bg-slate-700" />
          <Skeleton className="h-5 w-80 bg-slate-700" />
        </div>
        <Skeleton className="h-10 w-32 bg-slate-700" />
      </div>

      <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full bg-slate-700" />
                <Skeleton className="h-6 w-32 bg-slate-700" />
              </div>
              <Skeleton className="h-4 w-64 bg-slate-700" />
            </div>
            {/* Search and Filter */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-10 w-64 bg-slate-700" />
              <Skeleton className="h-10 w-32 bg-slate-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-700/50">
            <div className="w-full min-w-[1000px]">
              {/* Table Header */}
              <div className="flex items-center border-b border-slate-700/50 bg-slate-900/50 px-6 py-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1"
                  >
                    <Skeleton className="h-4 w-20 bg-slate-700" />
                  </div>
                ))}
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-700/50">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center px-6 py-4"
                  >
                    <div className="flex-1 pr-4">
                      <Skeleton className="h-5 w-full max-w-[180px] bg-slate-700" />
                    </div>
                    <div className="flex-1 pr-4">
                      <Skeleton className="mb-1 h-4 w-32 bg-slate-700" />
                      <Skeleton className="h-3 w-40 bg-slate-700" />
                    </div>
                    <div className="flex-1 pr-4">
                      <Skeleton className="h-5 w-24 bg-slate-700" />
                    </div>
                    <div className="flex-1 pr-4">
                      <Skeleton className="h-6 w-20 rounded-full bg-slate-700" />
                    </div>
                    <div className="flex-1 pr-4">
                      <Skeleton className="h-5 w-20 bg-slate-700" />
                    </div>
                    <div className="flex-1 pr-4">
                      <Skeleton className="h-4 w-32 bg-slate-700" />
                    </div>
                    <div className="flex-1 pr-4">
                      <Skeleton className="h-4 w-24 bg-slate-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-4">
                        <Skeleton className="h-5 w-10 bg-slate-700" />
                        <Skeleton className="h-5 w-5 bg-slate-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

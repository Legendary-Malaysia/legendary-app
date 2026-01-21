import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="mb-2 h-9 w-48 bg-slate-700" />
        <Skeleton className="h-5 w-96 bg-slate-700" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24 bg-slate-700" />
              <Skeleton className="h-4 w-4 rounded-full bg-slate-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-8 w-16 bg-slate-700" />
              <Skeleton className="h-3 w-32 bg-slate-700" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="mb-2 h-6 w-32 bg-slate-700" />
          <Skeleton className="h-4 w-64 bg-slate-700" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-lg bg-slate-900/50 p-3"
              >
                <Skeleton className="h-10 w-10 rounded-full bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 bg-slate-700" />
                  <Skeleton className="h-3 w-24 bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

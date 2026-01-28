import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex w-fit items-center gap-2">
        <Skeleton className="h-4 w-4 bg-slate-700" />
        <Skeleton className="h-4 w-32 bg-slate-700" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 bg-slate-700" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 bg-slate-700" />
            <Skeleton className="h-4 w-48 bg-slate-700" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Info Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <Skeleton className="h-5 w-24 bg-slate-700" />
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16 bg-slate-700" />
                  <Skeleton className="mt-1 h-4 w-32 bg-slate-700" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-3">
          <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded bg-slate-700" />
                <Skeleton className="h-6 w-24 bg-slate-700" />
              </div>
              <Skeleton className="h-4 w-64 bg-slate-700" />
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="space-y-4"
                >
                  <div className="flex justify-end">
                    <div className="max-w-[80%] space-y-2">
                      <Skeleton className="h-16 w-64 rounded-2xl rounded-tr-none bg-slate-700" />
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[80%] space-y-2">
                      <Skeleton className="h-24 w-80 rounded-2xl rounded-tl-none bg-indigo-900/40" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

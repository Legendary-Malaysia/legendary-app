import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-10 w-64 bg-slate-700" />
          <Skeleton className="mt-2 h-4 w-48 bg-slate-700" />
        </div>
      </div>

      <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded bg-slate-700" />
                <Skeleton className="h-6 w-32 bg-slate-700" />
              </div>
              <Skeleton className="h-4 w-48 bg-slate-700" />
            </div>
            {/* Search */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-10 w-full sm:w-64 bg-slate-700" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-700/50">
            <table className="w-full min-w-[800px] text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 text-xs text-slate-300 uppercase">
                <tr>
                  {[...Array(6)].map((_, i) => (
                    <th
                      key={i}
                      className="px-6 py-3 font-medium"
                    >
                      <Skeleton className="h-3 w-16 bg-slate-700" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[...Array(10)].map((_, i) => (
                  <tr
                    key={i}
                    className="group"
                  >
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20 bg-slate-700" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32 bg-slate-700" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-8 rounded-full bg-slate-700" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24 bg-slate-700" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24 bg-slate-700" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-12 bg-slate-700" />
                        <Skeleton className="h-4 w-12 bg-slate-700" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48 bg-slate-700" />
      </div>
    </div>
  );
}

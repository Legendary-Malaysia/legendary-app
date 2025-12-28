import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white p-4">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8">
        {/* Centered Logo */}
        <Skeleton className="h-12 w-48 opacity-20" />

        {/* Centered Input Box Skeleton */}
        <div className="bg-muted w-full rounded-2xl border border-solid shadow-xs min-h-[120px] flex flex-col">
           {/* Bottom buttons area */}
           <div className="flex items-center gap-6 p-2 mt-auto">
             <div className="ml-auto">
               <Skeleton className="h-9 w-20 rounded-md opacity-20" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

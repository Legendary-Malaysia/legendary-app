"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export function TicketSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    // Reset to page 1 when searching
    params.set("page", "1");
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative">
      <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-500" />
      <Input
        placeholder="Search tickets..."
        className="w-[200px] border-slate-700 bg-slate-900/50 pl-9 text-white placeholder:text-slate-500 hover:bg-slate-900/70 focus:bg-slate-900 sm:w-[300px]"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("search")?.toString()}
      />
    </div>
  );
}

export function TicketFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filtering
    params.set("page", "1");
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <Select
        onValueChange={(value) => handleFilter("status", value)}
        defaultValue={searchParams.get("status")?.toString() || "all"}
      >
        <SelectTrigger className="w-[140px] border-slate-700 bg-slate-900/50 text-slate-300">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        onValueChange={(value) => handleFilter("priority", value)}
        defaultValue={searchParams.get("priority")?.toString() || "all"}
      >
        <SelectTrigger className="w-[140px] border-slate-700 bg-slate-900/50 text-slate-300">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function TicketPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between border-t border-slate-700/50 px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">
            Page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

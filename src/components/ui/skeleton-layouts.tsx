import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

// Card Skeleton - for template cards, stat cards, etc.
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card p-6 rounded-lg border border-border", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <Skeleton className="h-3 w-1/3 mt-4" />
    </div>
  );
}

// Grid of Card Skeletons
export function CardGridSkeleton({ 
  count = 6, 
  columns = 3,
  className 
}: { 
  count?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn(
      "grid gap-6",
      columns === 2 && "grid-cols-1 md:grid-cols-2",
      columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Table Skeleton
export function TableSkeleton({ 
  rows = 5, 
  columns = 5,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("bg-card rounded-lg border border-border overflow-hidden", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Stats Card Skeleton
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card p-6 rounded-lg border border-border", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// Stats Grid Skeleton
export function StatsGridSkeleton({ 
  count = 4,
  className 
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({ 
  fields = 4,
  className 
}: { 
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("bg-card p-6 rounded-lg border border-border space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
}

// Page Header Skeleton
export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <Skeleton className="h-7 w-48" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
    </div>
  );
}

// Search Bar Skeleton
export function SearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card p-6 rounded-lg border border-border", className)}>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-1/2 rounded-md" />
        <Skeleton className="h-10 w-1/4 rounded-md" />
      </div>
    </div>
  );
}

// Tab Navigation Skeleton
export function TabNavSkeleton({ 
  tabs = 4,
  className 
}: { 
  tabs?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 py-3", className)}>
      {Array.from({ length: tabs }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-full" />
      ))}
    </div>
  );
}

// Calendar Skeleton
export function CalendarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card rounded-lg border border-border p-4", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

// Full Page Skeleton (for initial page load)
export function PageSkeleton({ 
  variant = "cards",
  className 
}: { 
  variant?: "cards" | "table" | "form" | "calendar";
  className?: string;
}) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
      <TabNavSkeleton />
      <SearchBarSkeleton />
      
      {variant === "cards" && <CardGridSkeleton count={6} />}
      {variant === "table" && <TableSkeleton rows={8} columns={6} />}
      {variant === "form" && <FormSkeleton fields={5} />}
      {variant === "calendar" && <CalendarSkeleton />}
    </div>
  );
}

// List Item Skeleton
export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-4 border-b border-border", className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ 
  items = 5,
  className 
}: { 
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn("bg-card rounded-lg border border-border overflow-hidden", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

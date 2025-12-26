// src/components/live-casino/TableCardSkeleton.tsx

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TableCardSkeleton = () => {
  return (
    <Card className="border-primary/20 overflow-hidden">
      {/* Image */}
      <Skeleton className="w-full aspect-square rounded-none" />

      {/* Text */}
      <div className="px-3 py-2 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </Card>
  );
};

export default TableCardSkeleton;

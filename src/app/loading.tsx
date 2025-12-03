import { Skeleton } from "@/components/ui/skeleton";
import { RailwayIcon } from "@/components/ui/icons";

export default function Loading() {
  return (
    <div className="container mx-auto p-4 py-8 md:p-8">
       <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 mb-4">
             <RailwayIcon className="h-10 w-10 text-primary" />
          </div>
          <Skeleton className="h-12 w-3/4 max-w-lg mb-4" />
          <Skeleton className="h-7 w-1/2 max-w-md" />
        </div>
      <div className="space-y-8">
        <Skeleton className="h-[350px] w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </div>
  );
}

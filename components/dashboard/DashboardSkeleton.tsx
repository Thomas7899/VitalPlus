// components/dashboard/DashboardSkeleton.tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; 

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-0 shadow-lg shadow-slate-200/50 bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2">

            <Skeleton className="h-4 w-[100px]" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>

                <Skeleton className="h-8 w-[60px] mb-2" />
              
                <Skeleton className="h-4 w-[40px]" />
              </div>
             
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
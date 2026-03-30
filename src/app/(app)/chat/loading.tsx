import { Skeleton } from '@/components/ui/skeleton';

export default function ChatLoading() {
  return (
    <div className="flex-1 flex overflow-hidden">
      <aside className="w-72 border-r bg-card hidden lg:block">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-20 w-2/3 rounded-lg" />
          </div>
          <div className="flex items-start gap-3 justify-end">
            <Skeleton className="h-16 w-1/2 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
          <div className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-32 w-3/4 rounded-lg" />
          </div>
        </div>

        <div className="border-t p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

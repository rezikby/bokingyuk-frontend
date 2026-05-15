export function Skeleton({ className='' }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

export function TableSkeleton({ rows=5, cols=5 }) {
  return (
    <div className="space-y-2">
      {Array.from({length: rows}).map((_,i) => (
        <div key={i} className="flex gap-4">
          {Array.from({length: cols}).map((_,j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

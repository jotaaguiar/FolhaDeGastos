type SkeletonVariant = 'card' | 'metric' | 'list-item' | 'chart';

interface SkeletonCardProps {
  variant?: SkeletonVariant;
  lines?: number;
}

export default function SkeletonCard({ variant = 'card', lines = 3 }: SkeletonCardProps) {
  if (variant === 'metric') {
    return (
      <div className="card p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="skeleton h-3 w-20 rounded-full" />
          <div className="skeleton w-8 h-8 rounded-lg" />
        </div>
        <div className="skeleton h-7 w-28 rounded-lg mb-2" />
        <div className="skeleton h-2.5 w-14 rounded-full" />
      </div>
    );
  }

  if (variant === 'list-item') {
    return (
      <div className="flex items-center gap-3 py-2.5">
        <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-3/4 rounded-full" />
          <div className="skeleton h-2.5 w-1/2 rounded-full" />
        </div>
        <div className="skeleton h-4 w-16 rounded-full shrink-0" />
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="card p-5">
        <div className="skeleton h-3 w-32 rounded-full mb-5" />
        <div className="skeleton h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="skeleton h-3 w-24 rounded-full mb-3" />
      <div className="skeleton h-7 w-32 rounded-lg mb-2" />
      {lines > 2 && <div className="skeleton h-2.5 w-20 rounded-full" />}
    </div>
  );
}

export default function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="skeleton h-3 w-24 mb-3 rounded" />
      <div className="skeleton h-7 w-32 mb-2 rounded" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  );
}

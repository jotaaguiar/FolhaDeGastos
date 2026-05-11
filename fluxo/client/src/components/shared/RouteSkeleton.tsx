export default function RouteSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in p-0">
      {/* Hero card */}
      <div className="card p-6 md:p-8">
        <div className="skeleton h-3 w-32 mb-4 rounded-full" />
        <div className="skeleton h-10 w-48 rounded-lg mb-2" />
        <div className="skeleton h-3 w-24 rounded-full" />
      </div>
      {/* Metric grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-4">
            <div className="flex justify-between mb-3">
              <div className="skeleton h-3 w-20 rounded-full" />
              <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
            <div className="skeleton h-6 w-28 rounded-lg mb-1.5" />
            <div className="skeleton h-2.5 w-14 rounded-full" />
          </div>
        ))}
      </div>
      {/* Content rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="card p-5">
            <div className="skeleton h-3 w-28 rounded-full mb-5" />
            <div className="space-y-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-full rounded-full" />
                    <div className="skeleton h-2.5 w-2/3 rounded-full" />
                  </div>
                  <div className="skeleton h-4 w-16 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

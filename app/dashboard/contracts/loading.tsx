export default function ContractsLoading() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div className="h-7 bg-gray-200 rounded w-36" />
        <div className="h-10 bg-gray-200 rounded-xl w-40" />
      </div>

      {/* Search bar */}
      <div className="h-10 bg-gray-100 rounded-xl w-full max-w-sm" />

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex gap-4">
          <div className="h-3 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-24 ml-auto" />
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="h-4 bg-gray-200 rounded w-36" />
              <div className="h-4 bg-gray-100 rounded flex-1" />
              <div className="h-6 bg-gray-100 rounded-full w-20" />
              <div className="h-4 bg-gray-100 rounded w-24" />
              <div className="h-4 bg-gray-100 rounded w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

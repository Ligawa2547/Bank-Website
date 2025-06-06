export default function KYCLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="h-16 bg-gray-200 rounded animate-pulse" />

      <div className="space-y-4">
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

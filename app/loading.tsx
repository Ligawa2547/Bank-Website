import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading page"><Skeleton className="h-10 w-64" /><Skeleton className="h-5 w-96 max-w-full" /><div className="grid gap-6 md:grid-cols-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div></main>
}

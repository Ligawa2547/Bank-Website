"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// Dynamically import the profile client component with no SSR
const ProfileClient = dynamic(() => import("./profile-client"), {
  ssr: false,
  loading: () => <ProfileSkeleton />,
})

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileClient />
    </Suspense>
  )
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6 h-10 w-48 rounded-md bg-gray-200" />
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-4">
            <div className="h-7 w-40 rounded-md bg-gray-200" />
            <div className="mt-1 h-5 w-60 rounded-md bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 w-20 rounded-md bg-gray-200" />
                <div className="h-10 w-full rounded-md bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-200 p-6">
          <div className="h-10 w-28 rounded-md bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

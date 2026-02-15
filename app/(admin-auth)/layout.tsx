import type React from "react"
import Image from "next/image"

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 relative">
            <Image src="/images/iae-logo.png" alt="AV Bank" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AV Bank</h1>
          <p className="text-gray-600">Alghahim Financial Services - Admin Portal</p>
        </div>
        {children}
      </div>
    </div>
  )
}

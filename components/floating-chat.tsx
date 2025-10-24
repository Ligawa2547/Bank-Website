"use client"

import { MessageCircle } from "lucide-react"
import { useState } from "react"

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat bubble button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold">IAE Bank Support</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 rounded p-1"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Chat content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="space-y-3">
              <div className="bg-blue-100 text-blue-900 p-3 rounded-lg max-w-xs">
                <p className="text-sm">👋 Hello! Welcome to IAE Bank. How can we help you today?</p>
              </div>
              <p className="text-xs text-gray-500 text-center">Average response time: 2 minutes</p>
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

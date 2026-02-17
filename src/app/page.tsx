"use client";

import Link from "next/link";
import { Radio, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Radio className="w-10 h-10 text-blue-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Skillmela Broadcast
          </h1>
        </div>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Real-time broadcast platform for sharing knowledge with your audience
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <Link
          href="/create"
          className="group flex flex-col items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-8 w-64 hover:border-blue-500/50 hover:bg-gray-900/80 transition-all duration-200"
        >
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Radio className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-1">Create Broadcast</h2>
            <p className="text-gray-400 text-sm">
              Start a new broadcast space as an administrator
            </p>
          </div>
        </Link>

        <Link
          href="/join"
          className="group flex flex-col items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-8 w-64 hover:border-purple-500/50 hover:bg-gray-900/80 transition-all duration-200"
        >
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Users className="w-8 h-8 text-purple-500" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-1">Join Broadcast</h2>
            <p className="text-gray-400 text-sm">
              Join an existing broadcast as instructor, student, or admin
            </p>
          </div>
        </Link>
      </div>
    </main>
  );
}

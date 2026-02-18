"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Mic,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

type Role = "instructor" | "student";

export default function JoinBroadcast() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      key: "instructor" as Role,
      label: "Instructor",
      icon: Mic,
      color: "blue",
      desc: "Send messages and files to students",
    },
    {
      key: "student" as Role,
      label: "Student",
      icon: GraduationCap,
      color: "green",
      desc: "View messages and download files",
    },
  ];

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }
    if (!code.trim()) {
      toast.error("Please enter the broadcast code");
      return;
    }

    setLoading(true);
    try {
      if (selectedRole === "instructor") {
        if (!password.trim()) {
          toast.error("Please enter the password");
          setLoading(false);
          return;
        }
        // Verify instructor access
        const res = await fetch("/api/broadcasts/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code.trim(), password: password.trim(), role: "instructor" }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Verification failed");
          setLoading(false);
          return;
        }
        router.push(`/broadcast/instructor?code=${encodeURIComponent(code.trim())}&password=${encodeURIComponent(password.trim())}`);
      } else if (selectedRole === "student") {
        // Verify student access (code only)
        const res = await fetch("/api/broadcasts/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code.trim(), role: "student" }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Verification failed");
          setLoading(false);
          return;
        }
        router.push(`/broadcast/student?code=${code.trim()}`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const colorMap: Record<string, string> = {
    blue: "border-blue-500/50 bg-blue-500/10",
    green: "border-green-500/50 bg-green-500/10",
    purple: "border-purple-500/50 bg-purple-500/10",
  };

  const iconColorMap: Record<string, string> = {
    blue: "text-blue-500",
    green: "text-green-500",
    purple: "text-purple-500",
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-6">Join Broadcast</h1>

          {/* Role selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select your role
            </label>
            <div className="grid grid-cols-2 gap-4">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.key;
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? colorMap[role.color]
                        : "border-gray-700 bg-gray-800 hover:border-gray-600"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected ? iconColorMap[role.color] : "text-gray-400"
                      }`}
                    />
                    <span className="text-xs font-medium">{role.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedRole && (
              <p className="text-gray-400 text-xs mt-2">
                {roles.find((r) => r.key === selectedRole)?.desc}
              </p>
            )}
          </div>

          {/* Form */}
          {selectedRole && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Broadcast Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter broadcast code"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono tracking-wider"
                />
              </div>

              {selectedRole === "instructor" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter broadcast password"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Broadcast"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

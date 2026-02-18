"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Radio,
  Shield,
  Loader2,
  Copy,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Broadcast } from "@/lib/types";

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const admin_name = searchParams.get("admin_name") || "";
  const password = searchParams.get("password") || "";
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  // Verify admin credentials on mount before showing anything
  useEffect(() => {
    if (!admin_name || !password) {
      toast.error("Access denied. Please join through the proper channel.");
      router.push("/join");
      return;
    }

    // Verify at least one broadcast matches credentials
    const verifyAndFetch = async () => {
      try {
        const res = await fetch(
          `/api/broadcasts?admin_name=${encodeURIComponent(admin_name)}`
        );
        const data = await res.json();
        if (res.ok) {
          const filtered = data.filter(
            (b: Broadcast) => b.password === password
          );
          if (filtered.length === 0) {
            toast.error("Invalid credentials. No matching broadcasts found.");
            router.push("/join");
            return;
          }
          setBroadcasts(filtered);
          setAuthenticated(true);
        } else {
          toast.error("Failed to verify credentials");
          router.push("/join");
        }
      } catch {
        toast.error("Failed to verify credentials");
        router.push("/join");
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetch();
  }, [admin_name, password, router]);

  const handleDelete = async (broadcast: Broadcast) => {
    if (
      !confirm(
        `Are you sure you want to delete broadcast "${broadcast.code}"? This cannot be undone. All messages and files will be permanently deleted.`
      )
    )
      return;

    setDeleting(broadcast.id);
    try {
      const res = await fetch(
        `/api/broadcasts/${broadcast.id}?admin_name=${encodeURIComponent(admin_name)}&password=${encodeURIComponent(password)}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== broadcast.id));
        toast.success("Broadcast deleted successfully");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete broadcast");
      }
    } catch {
      toast.error("Failed to delete broadcast");
    } finally {
      setDeleting(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Access denied. Redirecting...</p>
          <Loader2 className="w-6 h-6 animate-spin text-gray-500 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
            <p className="text-gray-400 text-sm">
              Welcome, <span className="text-purple-400">{admin_name}</span>
            </p>
          </div>
        </div>

        {broadcasts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <Radio className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-4">No broadcasts found</p>
            <Link
              href="/create"
              className="text-purple-400 hover:text-purple-300 text-sm underline"
            >
              Create a new broadcast
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-white">
                        {broadcast.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(broadcast.code)}
                        className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Created{" "}
                      {new Date(broadcast.created_at).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(broadcast)}
                  disabled={deleting === broadcast.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === broadcast.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="text-sm">Delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}

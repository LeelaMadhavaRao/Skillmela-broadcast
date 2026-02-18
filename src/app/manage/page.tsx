"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Trash2,
  Radio,
  Loader2,
  Copy,
  Plus,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Broadcast } from "@/lib/types";

export default function ManagePanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({
    admin_name: "admin@PAIE",
    password: "PAIE@srkr",
  });
  const [creating, setCreating] = useState(false);

  // Simple client-side auth (for demo - use proper auth in production)
  const ADMIN_PASSWORD = "PAIE@srkr"; // Change this in production

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      toast.success("Authenticated successfully");
    } else {
      toast.error("Invalid password");
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPassword("");
    setBroadcasts([]);
  };

  const fetchBroadcasts = async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const res = await fetch("/api/broadcasts");
      const data = await res.json();
      if (res.ok) {
        setBroadcasts(data);
      } else {
        toast.error("Failed to load broadcasts");
      }
    } catch {
      toast.error("Failed to load broadcasts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchBroadcasts();
    }
  }, [authenticated]);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcast.admin_name.trim() || !newBroadcast.password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBroadcast),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Broadcast created! Code: ${data.code}`);
        setNewBroadcast({ admin_name: "", password: "" });
        setShowCreateForm(false);
        fetchBroadcasts();
      } else {
        toast.error(data.error || "Failed to create broadcast");
      }
    } catch {
      toast.error("Failed to create broadcast");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (broadcast: Broadcast) => {
    if (
      !confirm(
        `Are you sure you want to delete broadcast "${broadcast.code}"? This will permanently delete all messages and files.`
      )
    )
      return;

    setDeleting(broadcast.id);
    try {
      const res = await fetch(
        `/api/broadcasts/${broadcast.id}?admin_name=${encodeURIComponent(broadcast.admin_name)}&password=${encodeURIComponent(broadcast.password)}`,
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

  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard");
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Shield className="w-8 h-8 text-purple-500" />
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold">Broadcast Management</h1>
              <p className="text-gray-400 text-sm">
                Manage all broadcasts in the system
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Broadcast</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Create New Broadcast</h2>
            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Administrator Name
                  </label>
                  <input
                    type="text"
                    value={newBroadcast.admin_name}
                    onChange={(e) =>
                      setNewBroadcast({ ...newBroadcast, admin_name: e.target.value })
                    }
                    placeholder="Enter admin name"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Broadcast Password
                  </label>
                  <input
                    type="text"
                    value={newBroadcast.password}
                    onChange={(e) =>
                      setNewBroadcast({ ...newBroadcast, password: e.target.value })
                    }
                    placeholder="Enter broadcast password"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Broadcast"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewBroadcast({ admin_name: "", password: "" });
                  }}
                  className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Broadcasts list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <Radio className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-4">No broadcasts found</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-purple-400 hover:text-purple-300 text-sm underline"
            >
              Create your first broadcast
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Radio className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
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
                        <span className="text-gray-600">|</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            Admin: <span className="text-gray-300">{broadcast.admin_name}</span>
                          </span>
                        </div>
                        <span className="text-gray-600">|</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            Password: <span className="text-gray-300 font-mono">{broadcast.password}</span>
                          </span>
                          <button
                            onClick={() => handleCopyPassword(broadcast.password)}
                            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                            title="Copy password"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Created{" "}
                        {new Date(broadcast.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(broadcast)}
                    disabled={deleting === broadcast.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  >
                    {deleting === broadcast.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="text-sm">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

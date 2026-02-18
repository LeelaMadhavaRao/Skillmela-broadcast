"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Radio,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

function StudentBroadcastContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") || "";
  const [authenticated, setAuthenticated] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [broadcastId, setBroadcastId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Verify student access on mount
  useEffect(() => {
    const verifyAccess = async () => {
      if (!code) {
        toast.error("Access denied. Please join through the proper channel.");
        router.push("/join");
        return;
      }

      try {
        const res = await fetch("/api/broadcasts/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, role: "student" }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Invalid broadcast code.");
          router.push("/join");
          return;
        }

        setAuthenticated(true);
      } catch {
        toast.error("Verification failed. Please try again.");
        router.push("/join");
      } finally {
        setVerifying(false);
      }
    };

    verifyAccess();
  }, [code, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    if (!code || !authenticated) return;
    try {
      const res = await fetch(`/api/messages?code=${code}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
        setBroadcastId(data.broadcast_id);
      } else {
        toast.error(data.error || "Failed to load messages");
        router.push("/join");
      }
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [code, router, authenticated]);

  useEffect(() => {
    if (authenticated) {
      fetchMessages();
    }
  }, [fetchMessages, authenticated]);

  // Real-time subscription
  useEffect(() => {
    if (!broadcastId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`broadcast-${broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `broadcast_id=eq.${broadcastId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `broadcast_id=eq.${broadcastId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? (payload.new as Message) : m
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((m) => m.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [broadcastId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download file");
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Verifying access...</p>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4 shrink-0">
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-green-500" />
          <div>
            <h1 className="font-semibold text-sm">Student View</h1>
            <p className="text-xs text-gray-400">
              Code: <span className="font-mono text-green-400">{code}</span>
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
            Student (View Only)
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <Radio className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No messages yet. Waiting for instructor...</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className="flex justify-start"
          >
            <div className="max-w-[80%] bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
              {message.content && (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}

              {message.file_url && (
                <div className="mt-2 flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-xs text-gray-300 truncate flex-1">
                    {message.file_name}
                  </span>
                  <button
                    onClick={() =>
                      handleDownload(message.file_url!, message.file_name!)
                    }
                    className="p-1 text-green-400 hover:text-green-300 transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-500">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {message.updated_at !== message.created_at && " (edited)"}
                </span>
                <div className="flex items-center gap-1">
                  {message.content && (
                    <button
                      onClick={() => handleCopy(message.content!)}
                      className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom bar - read only notice */}
      <div className="bg-gray-900 border-t border-gray-800 p-3 text-center shrink-0">
        <p className="text-xs text-gray-500">
          You are viewing this broadcast as a student. Messages are read-only.
        </p>
      </div>
    </div>
  );
}

export default function StudentBroadcast() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      }
    >
      <StudentBroadcastContent />
    </Suspense>
  );
}

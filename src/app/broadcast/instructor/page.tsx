"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Send,
  Paperclip,
  ArrowLeft,
  Copy,
  Edit3,
  Trash2,
  X,
  Check,
  FileText,
  Radio,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

function InstructorBroadcastContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") || "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [broadcastId, setBroadcastId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    if (!code) return;
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
  }, [code, router]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;
    if (!broadcastId) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("broadcast_id", broadcastId);
      if (newMessage.trim()) formData.append("content", newMessage.trim());
      if (file) formData.append("file", file);

      const res = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setNewMessage("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send message");
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleEdit = (message: Message) => {
    setEditingId(message.id);
    setEditContent(message.content || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    try {
      const res = await fetch(`/api/messages/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (res.ok) {
        toast.success("Message updated");
        setEditingId(null);
        setEditContent("");
      } else {
        toast.error("Failed to update message");
      }
    } catch {
      toast.error("Failed to update message");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    // Optimistically remove from local state
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Message deleted");
      } else {
        // Re-fetch on failure to restore state
        toast.error("Failed to delete message");
        fetchMessages();
      }
    } catch {
      toast.error("Failed to delete message");
      fetchMessages();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
          <Radio className="w-5 h-5 text-blue-500" />
          <div>
            <h1 className="font-semibold text-sm">Instructor View</h1>
            <p className="text-xs text-gray-400">
              Code: <span className="font-mono text-blue-400">{code}</span>
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
            Instructor
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <Radio className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No messages yet. Start broadcasting!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className="flex justify-end"
          >
            <div className="max-w-[80%] bg-blue-600/20 border border-blue-500/20 rounded-2xl rounded-tr-sm px-4 py-3">
              {editingId === message.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-400 hover:text-green-300"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}

                  {message.file_url && (
                    <div className="mt-2 flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-xs text-gray-300 truncate">
                        {message.file_name}
                      </span>
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
                      {message.content && (
                        <button
                          onClick={() => handleEdit(message)}
                          className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 shrink-0">
        {file && (
          <div className="flex items-center gap-2 mb-2 bg-gray-800 rounded-lg px-3 py-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-300 truncate flex-1">
              {file.name}
            </span>
            <button
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-gray-500 hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && !file)}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function InstructorBroadcast() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <InstructorBroadcastContent />
    </Suspense>
  );
}

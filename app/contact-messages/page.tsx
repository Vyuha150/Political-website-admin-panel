"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsPieCard, AnalyticsLineCard } from "@/components/ui/analytics-charts";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Inbox, Reply, AlertTriangle } from "lucide-react";

interface ContactMessage {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  subject?: string | null;
  message?: string | null;
  status?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
}

const contactColumns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "subject", label: "Subject" },
  { key: "message", label: "Message" },
  { key: "submitted_at", label: "Submitted" },
  { key: "status", label: "Status" },
];

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [fetchError, setFetchError] = useState<string>("");

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      setFetchError(error.message);
      setMessages([]);
      return;
    }

    setFetchError("");
    setMessages((data as ContactMessage[]) || []);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const unreadCount = messages.filter(
    (message) => message.status?.toLowerCase() === "unread"
  ).length;

  const repliedCount = messages.filter((message) =>
    ["replied", "responded"].includes(message.status?.toLowerCase() || "")
  ).length;

  const statusData = Object.entries(
    messages.reduce((acc: Record<string, number>, message) => {
      const key = message.status || "Unread";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const submissions7Days = (() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const key = d.toISOString().split("T")[0];
      return {
        key,
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        count: 0,
      };
    });

    const lookup = new Map(days.map((d) => [d.key, d]));
    messages.forEach((message) => {
      const sourceDate = message.submitted_at || message.created_at;
      if (!sourceDate) return;
      const key = new Date(sourceDate).toISOString().split("T")[0];
      const item = lookup.get(key);
      if (item) item.count += 1;
    });

    return days;
  })();

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Contact Messages
        </h1>
        <p className="text-gray-600 text-lg">
          View and track messages submitted from the website contact form
        </p>
      </div>
      {fetchError && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Could not load contact messages from the database table
          <span className="font-semibold"> contact_messages</span>. Error: {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Messages"
          value={messages.length}
          description="All contact submissions"
          icon={Mail}
          color="yellow"
        />
        <OverviewCard
          title="Unread"
          value={unreadCount}
          description="Needs review"
          icon={Inbox}
          color="orange"
        />
        <OverviewCard
          title="Responded"
          value={repliedCount}
          description="Replied to citizens"
          icon={Reply}
          color="purple"
        />
        <OverviewCard
          title="Flagged"
          value={messages.filter((message) => message.status === "Flagged").length}
          description="Require attention"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsPieCard
          title="Messages by Status"
          subtitle="Processing status split"
          data={statusData}
          emptyMessage="No status data available."
        />

        <AnalyticsLineCard
          title="Submission Volume (7 Days)"
          subtitle="Incoming contact trend"
          data={submissions7Days.map((item) => ({ name: item.day, value: item.count }))}
          emptyMessage="No submission trend data available."
        />
      </div>

      <DataTable
        title="Website Contact Messages"
        columns={contactColumns}
        data={messages.map((message) => ({
          ...message,
          name: message.name || message.full_name || "-",
          subject: message.subject || "General",
          message: message.message ? `${message.message.substring(0, 60)}...` : "-",
          submitted_at: message.submitted_at || message.created_at
            ? new Date(message.submitted_at || message.created_at || "")
                .toISOString()
                .split("T")[0]
            : "-",
          status: message.status || "Unread",
        }))}
        searchPlaceholder="Search contact messages..."
      />
    </div>
  );
}

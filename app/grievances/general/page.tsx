"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsVerticalBarCard, AnalyticsPieCard } from "@/components/ui/analytics-charts";
import { supabase } from "@/lib/supabaseClient";
import { MessageSquare, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { GrievanceModal } from "@/components/modals/grievance-model";

const grievanceColumns = [
  { key: "fullname", label: "Full Name" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "mobile", label: "Mobile" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  { key: "caste", label: "Caste" },
  { key: "aadhaar", label: "Aadhaar" },
  { key: "grievance", label: "Grievance Type" },
  { key: "grievance_other", label: "Other Grievance" },
  { key: "details", label: "Details" },
  { key: "attachments", label: "Attachments" },
  { key: "political_sensitive", label: "Political Sensitive" },
  { key: "parties", label: "Parties" },
  { key: "anonymous", label: "Anonymous" },
  { key: "opponent_name", label: "Opponent Name" },
  { key: "opponent_phone", label: "Opponent Phone" },
  { key: "opponent_details", label: "Opponent Details" },
  { key: "submitted_at", label: "Submitted At" },
  { key: "status", label: "Status" },
];

export default function GeneralGrievancesPage() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedGrievance, setSelectedGrievance] = useState<any | undefined>(
    undefined
  );

  // Dispute detection logic
  const [disputePairs, setDisputePairs] = useState<{ a: any; b: any }[]>([]);

  // Fetch grievances from Supabase
  const fetchGrievances = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("grievances")
      .select("*")
      .order("submitted_at", { ascending: false });
    setGrievances(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  useEffect(() => {
    // Find pairs where both parties have filed grievances against each other
    const pairs: { a: any; b: any }[] = [];
    for (let i = 0; i < grievances.length; i++) {
      for (let j = i + 1; j < grievances.length; j++) {
        const g1 = grievances[i];
        const g2 = grievances[j];
        if (
          g1.fullname &&
          g1.mobile &&
          g2.opponent_name &&
          g2.opponent_phone &&
          g2.fullname &&
          g2.mobile &&
          g1.opponent_name &&
          g1.opponent_phone &&
          g1.fullname.trim().toLowerCase() ===
            g2.opponent_name.trim().toLowerCase() &&
          g1.mobile.trim() === g2.opponent_phone.trim() &&
          g2.fullname.trim().toLowerCase() ===
            g1.opponent_name.trim().toLowerCase() &&
          g2.mobile.trim() === g1.opponent_phone.trim()
        ) {
          pairs.push({ a: g1, b: g2 });
        }
      }
    }
    setDisputePairs(pairs);
  }, [grievances]);

  // Overview stats (replace with real logic if needed)
  const totalGrievances = grievances.length;
  const openCases = grievances.filter((g) => g.status === "Open").length;
  const resolved = grievances.filter((g) => g.status === "Resolved").length;
  const inProgress = grievances.filter(
    (g) => g.status === "In Progress"
  ).length;

  const categoryMap = grievances.reduce((acc: Record<string, number>, item) => {
    const key = item.grievance || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const grievanceCategoryData = Object.entries(categoryMap).map(
    ([name, value]) => ({ name, value })
  );


  const statusMap = grievances.reduce((acc: Record<string, number>, item) => {
    const key = item.status || "Open";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const grievanceStatusData = Object.entries(statusMap).map(([name, value]) => ({
    name,
    value,
  }));


  // Modal handlers
  const handleAdd = () => {
    setModalMode("add");
    setSelectedGrievance(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (grievance: any) => {
    setModalMode("edit");
    setSelectedGrievance(grievance);
    setIsModalOpen(true);
  };

  const handleView = (grievance: any) => {
    setModalMode("view");
    setSelectedGrievance(grievance);
    setIsModalOpen(true);
  };

  const handleDelete = async (grievance: any) => {
    if (window.confirm("Are you sure you want to delete this grievance?")) {
      const { error } = await supabase
        .from("grievances")
        .delete()
        .eq("id", grievance.id);
      if (!error) fetchGrievances();
    }
  };

  const handleSave = async (data: any) => {
    if (modalMode === "add") {
      const { error } = await supabase.from("grievances").insert([data]);
      if (!error) fetchGrievances();
    } else if (modalMode === "edit" && selectedGrievance?.id) {
      const { error } = await supabase
        .from("grievances")
        .update(data)
        .eq("id", selectedGrievance.id);
      if (!error) fetchGrievances();
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          General Grievances
        </h1>
        <p className="text-gray-600 text-lg">
          Manage general citizen grievances and complaints
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Grievances"
          value={totalGrievances}
          description="All registered grievances"
          icon={MessageSquare}
          color="yellow"
        />
        <OverviewCard
          title="Open Cases"
          value={openCases}
          description="Requiring attention"
          icon={AlertTriangle}
          color="orange"
        />
        <OverviewCard
          title="Resolved"
          value={resolved}
          description="Successfully closed"
          icon={CheckCircle}
          color="red"
        />
        <OverviewCard
          title="In Progress"
          value={inProgress}
          description="Being processed"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Dispute Alert */}
      {disputePairs.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
          <strong>Dispute Alert:</strong> There are {disputePairs.length}{" "}
          dispute(s) where both parties have filed grievances against each
          other. Please review:
          <ul className="list-disc ml-6 mt-2">
            {disputePairs.map((pair, idx) => (
              <li key={idx}>
                <span className="font-semibold">
                  {pair.a.fullname} ({pair.a.mobile})
                </span>{" "}
                &amp;{" "}
                <span className="font-semibold">
                  {pair.b.fullname} ({pair.b.mobile})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsVerticalBarCard
          title="Grievances by Category"
          subtitle="Category-wise distribution"
          data={grievanceCategoryData}
          emptyMessage="No category data available."
        />

        <AnalyticsPieCard
          title="Grievances by Status"
          subtitle="Current status split"
          data={grievanceStatusData}
          emptyMessage="No status data available."
        />
      </div>

      {/* Grievances Table */}
      <DataTable
        title="All General Grievances"
        columns={grievanceColumns}
        data={grievances.map((grievance) => ({
          ...grievance,
          details: grievance.details?.substring(0, 50) + "...",
          submitted_at: grievance.submitted_at
            ? new Date(grievance.submitted_at).toISOString().split("T")[0]
            : "",
          status: (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                grievance.status === "Open"
                  ? "bg-red-100 text-red-800 border-red-200"
                  : grievance.status === "In Progress"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : grievance.status === "Resolved"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {grievance.status ?? "Open"}
            </span>
          ),
        }))}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        searchPlaceholder="Search grievances..."
      />

      {/* Grievance Modal */}
      <GrievanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        grievanceData={selectedGrievance}
        onSave={handleSave}
      />
    </div>
  );
}

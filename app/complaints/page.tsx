"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsPieCard, AnalyticsVerticalBarCard } from "@/components/ui/analytics-charts";
import { supabase } from "@/lib/supabaseClient";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { ComplaintModal } from "@/components/modals/complaints-model"; // You need to create this

const complaintColumns = [
  { key: "full_name", label: "Name" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  { key: "contact_mode", label: "Contact Mode" },
  { key: "problem_category", label: "Category" },
  { key: "constituency", label: "Constituency" },
  { key: "mandal_village", label: "Mandal/Village" },
  { key: "location", label: "Location" },
  { key: "problem_description", label: "Description" },
  { key: "supporting_documents", label: "Documents" },
  { key: "problem_date", label: "Problem Date" },
  { key: "reported_before", label: "Reported Before" },
  { key: "report_details", label: "Report Details" },
  { key: "specific_authority", label: "Specific Authority" },
  { key: "similar_issues", label: "Similar Issues" },
  { key: "similar_issues_details", label: "Similar Issues Details" },
  { key: "auth_name", label: "Authority Name" },
  { key: "auth_phone", label: "Authority Phone" },
  { key: "auth_email", label: "Authority Email" },
  { key: "leader_photo", label: "Leader Photo" },
  { key: "submitted_at", label: "Submitted At" },
  { key: "status", label: "Status" },
];

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedComplaint, setSelectedComplaint] = useState<any | undefined>(
    undefined
  );

  // Fetch complaints from Supabase
  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("submitted_at", { ascending: false });
    console.log("Fetched complaints:", data);
    if (error) {
      console.error(error);
      setComplaints([]);
    } else {
      setComplaints(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Overview stats
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter(
    (c) => c.status === "Pending"
  ).length;
  const inProgressComplaints = complaints.filter(
    (c) => c.status === "In Progress"
  ).length;
  const resolvedComplaints = complaints.filter(
    (c) => c.status === "Resolved"
  ).length;
  const categoryData = Object.entries(
    complaints.reduce((acc: Record<string, number>, complaint) => {
      const key = complaint.problem_category || "Other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const statusData = Object.entries(
    complaints.reduce((acc: Record<string, number>, complaint) => {
      const key = complaint.status || "Pending";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Modal handlers
  const handleAddComplaint = () => {
    setModalMode("add");
    setSelectedComplaint(undefined);
    setIsModalOpen(true);
  };

  const handleEditComplaint = (complaint: any) => {
    setModalMode("edit");
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };

  const handleViewComplaint = (complaint: any) => {
    setModalMode("view");
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };

  const handleSaveComplaint = async (data: any) => {
    if (modalMode === "add") {
      const { error } = await supabase.from("complaints").insert([data]);
      if (error) alert("Error adding complaint: " + error.message);
    } else if (modalMode === "edit" && selectedComplaint?.id) {
      const { error } = await supabase
        .from("complaints")
        .update(data)
        .eq("id", selectedComplaint.id);
      if (error) alert("Error updating complaint: " + error.message);
    }
    setIsModalOpen(false);
    fetchComplaints();
  };

  const handleDeleteComplaint = async (complaint: any) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", complaint.id);
      if (error) {
        alert("Error deleting complaint: " + error.message);
      } else {
        fetchComplaints();
      }
    }
  };

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Complaints Management
        </h1>
        <p className="text-gray-600 text-lg">
          Track and manage citizen complaints
        </p>
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Complaints"
          value={totalComplaints}
          description="All registered complaints"
          icon={FileText}
          color="red"
        />
        <OverviewCard
          title="Pending"
          value={pendingComplaints}
          description="Awaiting action"
          icon={Clock}
          color="purple"
        />
        <OverviewCard
          title="In Progress"
          value={inProgressComplaints}
          description="Being processed"
          icon={AlertTriangle}
          color="orange"
        />
        <OverviewCard
          title="Resolved"
          value={resolvedComplaints}
          description="Successfully closed"
          icon={CheckCircle}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsVerticalBarCard
          title="Complaints by Category"
          subtitle="Problem category distribution"
          data={categoryData}
          emptyMessage="No category data available."
        />

        <AnalyticsPieCard
          title="Complaints by Status"
          subtitle="Current workflow status split"
          data={statusData}
          emptyMessage="No status data available."
        />
      </div>

      {/* Complaints Table */}
      <DataTable
        title="All Complaints"
        columns={complaintColumns}
        data={complaints.map((complaint) => ({
          ...complaint,
          problem_description:
            complaint.problem_description?.substring(0, 50) + "...",
          status: (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                complaint.status === "Pending"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : complaint.status === "In Progress"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : complaint.status === "Resolved"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : ""
              }`}
            >
              {complaint.status}
            </span>
          ),
        }))}
        onAdd={handleAddComplaint}
        onEdit={handleEditComplaint}
        onView={handleViewComplaint}
        onDelete={handleDeleteComplaint}
        searchPlaceholder="Search complaints..."
      />

      {/* Complaints Modal */}
      <ComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        complaintData={selectedComplaint}
        onSave={handleSaveComplaint}
      />
    </div>
  );
}

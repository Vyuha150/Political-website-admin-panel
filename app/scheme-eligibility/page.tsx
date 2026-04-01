"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsVerticalBarCard, AnalyticsPieCard } from "@/components/ui/analytics-charts";
import { supabase } from "@/lib/supabaseClient";
import { ClipboardList, CheckCircle, Clock, Users } from "lucide-react";
import { SchemeEligibilityModal } from "@/components/modals/scheme-eligibility-model";

const schemeEligibilityColumns = [
  { key: "fullname", label: "Full Name" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "mobile", label: "Mobile" },
  { key: "aadhaar", label: "Aadhaar" },
  { key: "caste", label: "Caste" },
  { key: "marital", label: "Marital Status" },
  { key: "disability", label: "Disability" },
  { key: "disability_details", label: "Disability Details" },
  { key: "income", label: "Income" },
  { key: "education", label: "Education" },
  { key: "employment", label: "Employment" },
  { key: "skill_training", label: "Skill Training" },
  { key: "skill_training_details", label: "Skill Training Details" },
  { key: "social_service", label: "Social Service" },
  { key: "social_service_details", label: "Social Service Details" },
  { key: "welfare_member", label: "Welfare Member" },
  { key: "schemes", label: "Schemes" },
  { key: "submitted_at", label: "Submitted At" },
  { key: "status", label: "Status" }, // <-- Add this line
];

export default function SchemeEligibilityPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedApplication, setSelectedApplication] = useState<
    any | undefined
  >(undefined);

  // Fetch applications from Supabase
  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scheme_eligibility")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) {
      setApplications([]);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Overview stats (customize as needed)
  const totalApplications = applications.length;
  const approved = applications.filter((a) => a.status === "Approved").length;
  const underReview = applications.filter(
    (a) => a.status === "Under Review"
  ).length;
  const beneficiaries = applications.filter(
    (a) => a.status === "Beneficiary"
  ).length;

  const statusData = Object.entries(
    applications.reduce((acc: Record<string, number>, app) => {
      const key = app.status || "Under Review";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const casteData = Object.entries(
    applications.reduce((acc: Record<string, number>, app) => {
      const key = app.caste || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([caste, count]) => ({ caste, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Modal handlers
  const handleAdd = () => {
    setModalMode("add");
    setSelectedApplication(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (app: any) => {
    setModalMode("edit");
    const original = applications.find((a) => a.id === app.id);
    setSelectedApplication(original || app);
    setIsModalOpen(true);
  };

  const handleView = (app: any) => {
    setModalMode("view");
    const original = applications.find((a) => a.id === app.id);
    setSelectedApplication(original || app);
    setIsModalOpen(true);
  };

  const handleDelete = async (app: any) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      const { error } = await supabase
        .from("scheme_eligibility")
        .delete()
        .eq("id", app.id);
      if (!error) fetchApplications();
    }
  };

  const handleSave = async (data: any) => {
    if (modalMode === "add") {
      const { error } = await supabase
        .from("scheme_eligibility")
        .insert([data]);
      if (!error) fetchApplications();
    } else if (modalMode === "edit" && selectedApplication?.id) {
      const { error } = await supabase
        .from("scheme_eligibility")
        .update(data)
        .eq("id", selectedApplication.id);
      if (!error) fetchApplications();
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Scheme Eligibility
        </h1>
        <p className="text-gray-600 text-lg">
          Manage government scheme eligibility applications
        </p>
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Applications"
          value={totalApplications}
          description="All eligibility checks"
          icon={ClipboardList}
          color="yellow"
        />
        <OverviewCard
          title="Approved"
          value={approved}
          description="Eligible for schemes"
          icon={CheckCircle}
          color="red"
        />
        <OverviewCard
          title="Under Review"
          value={underReview}
          description="Being processed"
          icon={Clock}
          color="orange"
        />
        <OverviewCard
          title="Beneficiaries"
          value={beneficiaries}
          description="Active beneficiaries"
          icon={Users}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsPieCard
          title="Applications by Status"
          subtitle="Workflow breakdown"
          data={statusData}
          emptyMessage="No status data available."
        />

        <AnalyticsBarCard
          title="Top Caste Segments"
          subtitle="Applications by caste category"
          data={casteData.map((entry) => ({ name: entry.caste, value: entry.count }))}
          emptyMessage="No caste segment data available."
        />
      </div>

      {/* Scheme Eligibility Table */}
      <DataTable
        title="Eligibility Applications"
        columns={schemeEligibilityColumns}
        data={applications.map((app) => ({
          ...app,
          submitted_at: app.submitted_at
            ? new Date(app.submitted_at).toISOString().split("T")[0]
            : "",
          status: (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                app.status === "Approved"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : app.status === "Beneficiary"
                  ? "bg-purple-100 text-purple-800 border-purple-200"
                  : app.status === "Under Review"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : app.status === "Rejected"
                  ? "bg-red-100 text-red-800 border-red-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {app.status ?? "Under Review"}
            </span>
          ),
        }))}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        searchPlaceholder="Search applications..."
      />

      {/* Modal */}
      <SchemeEligibilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        eligibilityData={selectedApplication}
        onSave={handleSave}
      />
    </div>
  );
}

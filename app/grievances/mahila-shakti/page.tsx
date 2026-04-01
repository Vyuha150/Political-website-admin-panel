"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsVerticalBarCard, AnalyticsPieCard } from "@/components/ui/analytics-charts";
import { supabase } from "@/lib/supabaseClient";
import { Heart, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { MahilaShaktiGrievanceModal } from "@/components/modals/mahila-shakti-grievance-model";

const mahilaGrievanceColumns = [
  { key: "fullname", label: "Full Name" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "mobile", label: "Mobile" },
  { key: "email", label: "Email" },
  { key: "district", label: "District" },
  { key: "constituency", label: "Constituency" },
  { key: "mandal", label: "Mandal" },
  { key: "ward", label: "Ward" },
  { key: "grievance_types", label: "Grievance Types" },
  { key: "grievance_other", label: "Other Grievance" },
  { key: "description", label: "Description" },
  { key: "attachments", label: "Attachments" },
  { key: "response_modes", label: "Response Modes" },
  { key: "volunteer", label: "Volunteer" },
  { key: "declaration", label: "Declaration" },
  { key: "submitted_at", label: "Submitted At" },
];

export default function MahilaShaktiGrievancesPage() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedGrievance, setSelectedGrievance] = useState<any | undefined>(
    undefined
  );

  // Fetch from Supabase
  const fetchGrievances = async () => {
    setLoading(true);
    const [{ data: grievanceData, error: grievanceError }, { data: registrationData, error: registrationError }] = await Promise.all([
      supabase
        .from("mahila_shakti_grievances")
        .select("*")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("mahila_shakti_registrations")
        .select("*")
        .order("submitted_at", { ascending: false }),
    ]);

    if (grievanceError) console.error("mahila_shakti_grievances fetch error:", grievanceError);
    if (registrationError) console.error("mahila_shakti_registrations fetch error:", registrationError);

    const normalizedRegistrations = (registrationData || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      fullname: item.fullname,
      age: item.age,
      gender: null,
      mobile: item.mobile,
      email: item.email,
      district: item.district,
      constituency: item.constituency,
      mandal: null,
      ward: null,
      grievance_types: item.interest_areas || [],
      grievance_other: item.grievance || null,
      description: item.why_join || item.grievance || null,
      attachments: [],
      response_modes: [],
      volunteer: null,
      declaration: item.declaration,
      status: item.status || "Registered",
      submitted_at: item.submitted_at,
      source_table: "mahila_shakti_registrations",
    }));

    const normalizedGrievances = (grievanceData || []).map((item: any) => ({
      ...item,
      source_table: "mahila_shakti_grievances",
    }));

    const merged = [...normalizedGrievances, ...normalizedRegistrations].sort(
      (a: any, b: any) =>
        new Date(b.submitted_at || 0).getTime() -
        new Date(a.submitted_at || 0).getTime()
    );

    setGrievances(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

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
      if (grievance?.source_table === "mahila_shakti_registrations") {
        alert("This entry is a Mahila registration record. Please manage it from the registrations table.");
        return;
      }
      await supabase
        .from("mahila_shakti_grievances")
        .delete()
        .eq("id", grievance.id);
      fetchGrievances();
    }
  };

  const handleSave = async (data: any) => {
    if (selectedGrievance?.source_table === "mahila_shakti_registrations") {
      alert("Editing Mahila registration records from this modal is not supported.");
      return;
    }

    const payload = {
      ...data,
      age: data.age ? Number(data.age) : null,
      declaration: !!data.declaration,
      grievance_types: Array.isArray(data.grievance_types)
        ? data.grievance_types
        : [],
      response_modes: Array.isArray(data.response_modes)
        ? data.response_modes
        : [],
      attachments: Array.isArray(data.attachments) ? data.attachments : [],
      gender: data.gender || null,
      // add other fields as needed
    };

    let result;
    if (modalMode === "add") {
      result = await supabase
        .from("mahila_shakti_grievances")
        .insert([payload]);
    } else if (modalMode === "edit" && selectedGrievance?.id) {
      result = await supabase
        .from("mahila_shakti_grievances")
        .update(payload)
        .eq("id", selectedGrievance.id);
    }
    if (result?.error) {
      alert("Error: " + result.error.message);
      return;
    }
    fetchGrievances();
    setIsModalOpen(false);
  };

  const totalGrievances = grievances.length;
  const urgent = grievances.filter((g) =>
    g.grievance_types?.includes("Urgent")
  ).length;
  const underReview = grievances.filter(
    (g) => g.status === "Under Review"
  ).length;
  const resolved = grievances.filter((g) => g.status === "Resolved").length;

  const grievanceTypeData = Object.entries(
    grievances.reduce((acc: Record<string, number>, grievance) => {
      if (Array.isArray(grievance.grievance_types) && grievance.grievance_types.length) {
        grievance.grievance_types.forEach((item: string) => {
          const key = item || "Other";
          acc[key] = (acc[key] || 0) + 1;
        });
      } else {
        acc.Other = (acc.Other || 0) + 1;
      }
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));


  const statusData = Object.entries(
    grievances.reduce((acc: Record<string, number>, grievance) => {
      const key = grievance.status || "Under Review";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));


  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Mahila Shakti Grievances
        </h1>
        <p className="text-gray-600 text-lg">
          Manage women empowerment related grievances
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Cases"
          value={totalGrievances}
          description="Women's grievances"
          icon={Heart}
          color="purple"
        />
        <OverviewCard
          title="Urgent Cases"
          value={urgent}
          description="High priority"
          icon={AlertTriangle}
          color="red"
        />
        <OverviewCard
          title="Under Review"
          value={underReview}
          description="Being processed"
          icon={Shield}
          color="orange"
        />
        <OverviewCard
          title="Resolved"
          value={resolved}
          description="Successfully closed"
          icon={CheckCircle}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsVerticalBarCard
          title="Grievance Types"
          subtitle="Type-wise case distribution"
          data={grievanceTypeData}
          emptyMessage="No grievance-type data available."
        />

        <AnalyticsPieCard
          title="Status Distribution"
          subtitle="Current case status split"
          data={statusData}
          emptyMessage="No status data available."
        />
      </div>

      {/* Mahila Shakti Grievances Table */}
      <DataTable
        title="Mahila Shakti Grievances"
        columns={mahilaGrievanceColumns}
        data={grievances.map((grievance) => ({
          ...grievance,
          grievance_types: Array.isArray(grievance.grievance_types)
            ? grievance.grievance_types.join(", ")
            : grievance.grievance_types,
          response_modes: Array.isArray(grievance.response_modes)
            ? grievance.response_modes.join(", ")
            : grievance.response_modes,
          description: grievance.description
            ? `${grievance.description.substring(0, 50)}...`
            : "",
          declaration: grievance.declaration ? "Yes" : "No",
          submitted_at: grievance.submitted_at
            ? new Date(grievance.submitted_at).toISOString().split("T")[0]
            : "",
        }))}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        searchPlaceholder="Search mahila grievances..."
      />

      {/* Modal */}
      <MahilaShaktiGrievanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        grievanceData={selectedGrievance}
        onSave={handleSave}
      />
    </div>
  );
}

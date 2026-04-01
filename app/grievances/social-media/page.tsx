"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsVerticalBarCard, AnalyticsPieCard } from "@/components/ui/analytics-charts";
import { supabase } from "@/lib/supabaseClient";
import {
  MessageCircle,
  Share2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { SocialMediaGrievanceModal } from "@/components/modals/social-media-grievance-model";

const socialMediaGrievanceColumns = [
  { key: "fullname", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "platforms", label: "Platforms" },
  { key: "platform_other", label: "Other Platform" },
  { key: "grievance", label: "Grievance" },
  { key: "action", label: "Action Requested" },
  { key: "file_urls", label: "Files" },
  { key: "warrior_options", label: "Warrior Options" },
  { key: "updates_options", label: "Updates Options" },
  { key: "submitted_at", label: "Submitted" },
  { key: "status", label: "Status" },
];

export default function SocialMediaGrievancesPage() {
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
    const { data } = await supabase
      .from("social_media_grievances")
      .select("*")
      .order("submitted_at", { ascending: false });
    console.log("Fetched grievances:", data);
    setGrievances(data || []);
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
      await supabase
        .from("social_media_grievances")
        .delete()
        .eq("id", grievance.id);
      fetchGrievances();
    }
  };

  const handleSave = async (data: any) => {
    const payload = {
      ...data,
      platforms: Array.isArray(data.platforms) ? data.platforms : [],
      file_urls: Array.isArray(data.file_urls) ? data.file_urls : [],
      warrior_options: Array.isArray(data.warrior_options)
        ? data.warrior_options
        : [],
      updates_options: Array.isArray(data.updates_options)
        ? data.updates_options
        : [],
      // add other fields as needed
    };

    let result;
    if (modalMode === "add") {
      result = await supabase.from("social_media_grievances").insert([payload]);
    } else if (modalMode === "edit" && selectedGrievance?.id) {
      result = await supabase
        .from("social_media_grievances")
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

  const platformMap = grievances.reduce((acc: Record<string, number>, item) => {
    if (Array.isArray(item.platforms) && item.platforms.length > 0) {
      item.platforms.forEach((platform: string) => {
        const key = platform || "Other";
        acc[key] = (acc[key] || 0) + 1;
      });
    } else {
      acc.Other = (acc.Other || 0) + 1;
    }
    return acc;
  }, {});

  const platformData = Object.entries(platformMap).map(([name, value]) => ({
    name,
    value,
  }));

  const statusMap = grievances.reduce((acc: Record<string, number>, item) => {
    const key = item.status || "Investigating";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusMap).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Social Media Grievances
        </h1>
        <p className="text-gray-600 text-lg">
          Manage social media related complaints and issues
        </p>
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Cases"
          value={totalGrievances}
          description="Social media grievances"
          icon={MessageCircle}
          color="yellow"
        />
        <OverviewCard
          title="Platform Reports"
          value={grievances.filter((g) => g.platforms?.length).length}
          description="Reported to platforms"
          icon={Share2}
          color="yellow"
        />
        <OverviewCard
          title="Investigating"
          value={grievances.filter((g) => g.status === "Investigating").length}
          description="Under investigation"
          icon={AlertTriangle}
          color="orange"
        />
        <OverviewCard
          title="Action Taken"
          value={grievances.filter((g) => g.status === "Action Taken").length}
          description="Successfully resolved"
          icon={CheckCircle}
          color="purple"
        />
      </div>

      {/* Social Media Grievances Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsVerticalBarCard
          title="Reports by Platform"
          subtitle="Platform usage distribution"
          data={platformData}
          emptyMessage="No platform data available."
        />

        <AnalyticsPieCard
          title="Reports by Status"
          subtitle="Current status breakdown"
          data={statusData}
          emptyMessage="No status data available."
        />
      </div>

      <DataTable
        title="Social Media Grievances"
        columns={socialMediaGrievanceColumns}
        data={grievances.map((grievance) => ({
          ...grievance,
          platforms: Array.isArray(grievance.platforms)
            ? grievance.platforms.join(", ")
            : grievance.platforms,
          file_urls: Array.isArray(grievance.file_urls)
            ? grievance.file_urls.join(", ")
            : grievance.file_urls,
          warrior_options: Array.isArray(grievance.warrior_options)
            ? grievance.warrior_options.join(", ")
            : grievance.warrior_options,
          updates_options: Array.isArray(grievance.updates_options)
            ? grievance.updates_options.join(", ")
            : grievance.updates_options,
          grievance: grievance.grievance?.substring(0, 50) + "...",
          submitted_at: grievance.submitted_at
            ? new Date(grievance.submitted_at).toISOString().split("T")[0]
            : "",
          status: (
            <span
              className={
                "px-2 py-1 rounded-full text-xs font-semibold " +
                (grievance.status === "Action Taken"
                  ? "bg-green-100 text-green-800"
                  : grievance.status === "Investigating"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800")
              }
            >
              {grievance.status}
            </span>
          ),
        }))}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        searchPlaceholder="Search social media grievances..."
      />

      {/* Modal */}
      <SocialMediaGrievanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        grievanceData={selectedGrievance}
        onSave={handleSave}
      />
    </div>
  );
}

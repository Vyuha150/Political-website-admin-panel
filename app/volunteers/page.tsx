"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsBarCard, AnalyticsVerticalBarCard } from "@/components/ui/analytics-charts";
import { supabase } from "@/lib/supabaseClient";
import { UserCheck, MapPin, Clock, Heart } from "lucide-react";
import { VolunteerModal } from "@/components/modals/volunteer-model";

const volunteerColumns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "constituency", label: "Constituency" },
  { key: "message", label: "Message" },
  { key: "submitted_at", label: "Applied Date" },
];

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | undefined>(
    undefined
  );

  // Fetch volunteers from Supabase
  const fetchVolunteers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("volunteers")
      .select("*")
      .order("submitted_at", { ascending: false });
    setVolunteers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  // Overview stats (customize as needed)
  const totalVolunteers = volunteers.length;
  const activeVolunteers = volunteers.length; // Replace with your logic
  const constituencies = new Set(volunteers.map((v) => v.constituency)).size;
  const pendingReviews = 0; // Replace with your logic

  const topConstituenciesData = Object.entries(
    volunteers.reduce((acc: Record<string, number>, volunteer) => {
      const key = volunteer.constituency || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([constituency, count]) => ({ constituency, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const submissionVolumeData = (() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const key = d.toISOString().split("T")[0];
      return {
        key,
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        submissions: 0,
      };
    });

    const lookup = new Map(days.map((d) => [d.key, d]));

    volunteers.forEach((volunteer) => {
      if (!volunteer.submitted_at) return;
      const dateKey = new Date(volunteer.submitted_at).toISOString().split("T")[0];
      const day = lookup.get(dateKey);
      if (day) {
        day.submissions += 1;
      }
    });

    return days;
  })();

  // Modal handlers
  const handleAdd = () => {
    setModalMode("add");
    setSelectedVolunteer(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (volunteer: any) => {
    setModalMode("edit");
    setSelectedVolunteer(volunteer);
    setIsModalOpen(true);
  };

  const handleView = (volunteer: any) => {
    setModalMode("view");
    setSelectedVolunteer(volunteer);
    setIsModalOpen(true);
  };

  const handleDelete = async (volunteer: any) => {
    if (window.confirm("Are you sure you want to delete this volunteer?")) {
      const { error } = await supabase
        .from("volunteers")
        .delete()
        .eq("id", volunteer.id);
      if (!error) fetchVolunteers();
    }
  };

  const handleSave = async (data: any) => {
    if (modalMode === "add") {
      const { error } = await supabase.from("volunteers").insert([data]);
      if (!error) fetchVolunteers();
    } else if (modalMode === "edit" && selectedVolunteer?.id) {
      const { error } = await supabase
        .from("volunteers")
        .update(data)
        .eq("id", selectedVolunteer.id);
      if (!error) fetchVolunteers();
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Volunteers Management
        </h1>
        <p className="text-gray-600 text-lg">
          Manage volunteer applications and activities
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Volunteers"
          value={totalVolunteers}
          description="Registered volunteers"
          icon={UserCheck}
          trend={{ value: totalVolunteers, isPositive: true }}
          color="red"
        />
        <OverviewCard
          title="Active Volunteers"
          value={activeVolunteers}
          description="Currently active"
          icon={Heart}
          color="yellow"
        />
        <OverviewCard
          title="Constituencies"
          value={constituencies}
          description="Areas covered"
          icon={MapPin}
          color="purple"
        />
        <OverviewCard
          title="Pending Reviews"
          value={pendingReviews}
          description="Applications to review"
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsVerticalBarCard
          title="Top Constituencies"
          subtitle="Volunteer concentration by area"
          data={topConstituenciesData.map((item) => ({
            name: item.constituency,
            value: item.count,
          }))}
          emptyMessage="No constituency data available."
        />

        <AnalyticsBarCard
          title="Submission Volume (7 Days)"
          subtitle="Recent volunteer application trend"
          data={submissionVolumeData.map((item) => ({
            name: item.day,
            value: item.submissions,
          }))}
          emptyMessage="No submission trend data available."
        />
      </div>

      {/* Volunteers Table */}
      <DataTable
        title="All Volunteers"
        columns={volunteerColumns}
        data={volunteers.map((v) => ({
          ...v,
          submitted_at: v.submitted_at
            ? new Date(v.submitted_at).toISOString().split("T")[0]
            : "",
        }))}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        searchPlaceholder="Search volunteers..."
      />

      {/* Volunteer Modal */}
      <VolunteerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        volunteerData={selectedVolunteer}
        onSave={handleSave}
      />
    </div>
  );
}

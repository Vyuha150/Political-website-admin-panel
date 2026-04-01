"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsBarCard, AnalyticsPieCard, AnalyticsVerticalBarCard } from "@/components/ui/analytics-charts";
import { supabase } from "@/lib/supabaseClient";
import { YuvaShakthiModal } from "@/components/modals/yuva-shakthi-model";
import { Users2, MapPin, GraduationCap, Briefcase } from "lucide-react";
import { YuvaShakthiMember } from "@/types/yuva-shakthi-member";

const memberColumns = [
  { key: "fullname", label: "Full Name" },
  { key: "parentname", label: "Parent Name" },
  { key: "dob", label: "Date of Birth" },
  { key: "gender", label: "Gender" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  { key: "village", label: "Village" },
  { key: "mandal", label: "Mandal" },
  { key: "constituency", label: "Constituency" },
  { key: "district", label: "District" },
  { key: "education", label: "Education" },
  { key: "stream", label: "Stream" },
  { key: "occupation", label: "Occupation" },
  { key: "skills", label: "Skills" },
  { key: "interests", label: "Interests" },
  { key: "interest_other", label: "Other Interests" },
  { key: "why", label: "Why" },
  { key: "submitted_at", label: "Submitted At" },
];

export default function YuvaShakthiPage() {
  const [members, setMembers] = useState<YuvaShakthiMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedMember, setSelectedMember] = useState<any | undefined>(
    undefined
  );

  // Fetch members from Supabase
  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("yuva_shakthi_members")
      .select("*")
      .order("submitted_at", { ascending: false });
    console.log("Fetched members:", data);
    if (error) {
      console.error(error);
      setMembers([]);
    } else {
      setMembers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("Supabase session:", data.session);
    });
  }, []);

  // Modal handlers
  const handleAddMember = () => {
    setModalMode("add");
    setSelectedMember(undefined);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: any) => {
    setModalMode("edit");
    // Find the original member object by id
    const original = members.find((m) => m.id === member.id);
    setSelectedMember(original || member);
    setIsModalOpen(true);
  };

  const handleViewMember = (member: any) => {
    setModalMode("view");
    const original = members.find((m) => m.id === member.id);
    setSelectedMember(original || member);
    setIsModalOpen(true);
  };

  const handleSaveMember = async (data: any) => {
    if (modalMode === "add") {
      const { error } = await supabase
        .from("yuva_shakthi_members")
        .insert([data]);
      if (error) alert("Error adding member: " + error.message);
    } else if (modalMode === "edit" && selectedMember?.id) {
      const { error } = await supabase
        .from("yuva_shakthi_members")
        .update(data)
        .eq("id", selectedMember.id);
      if (error) alert("Error updating member: " + error.message);
    }
    setIsModalOpen(false);
    fetchMembers();
  };

  const handleDeleteMember = async (member: any) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      const { error } = await supabase
        .from("yuva_shakthi_members")
        .delete()
        .eq("id", member.id);
      if (error) {
        alert("Error deleting member: " + error.message);
      } else {
        fetchMembers();
      }
    }
  };

  // Calculate stats from members
  const totalMembers = members.length;
  const uniqueDistricts = new Set(members.map((m) => m.district)).size;
  const graduates = members.filter(
    (m) =>
      (m.education || "").toLowerCase().includes("graduate") ||
      (m.education || "").toLowerCase().includes("degree")
  ).length;
  const employed = members.filter(
    (m) =>
      (m.occupation || "").toLowerCase().includes("employ") ||
      (m.occupation || "").toLowerCase().includes("job") ||
      (m.occupation || "").toLowerCase().includes("work")
  ).length;

  const districtData = Object.entries(
    members.reduce((acc: Record<string, number>, member) => {
      const key = member.district || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const genderData = Object.entries(
    members.reduce((acc: Record<string, number>, member) => {
      const key = member.gender || "Not Specified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Yuva Shakthi Members
        </h1>
        <p className="text-gray-600 text-lg">
          Manage youth empowerment program members
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Members"
          value={totalMembers}
          description="Registered members"
          icon={Users2}
          trend={{ value: totalMembers, isPositive: true }}
          color="yellow"
        />
        <OverviewCard
          title="Active Districts"
          value={uniqueDistricts}
          description="Covered districts"
          icon={MapPin}
          color="red"
        />
        <OverviewCard
          title="Graduates"
          value={graduates}
          description="Members with a degree"
          icon={GraduationCap}
          color="purple"
        />
        <OverviewCard
          title="Employed"
          value={employed}
          description="Members currently working"
          icon={Briefcase}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsVerticalBarCard
          title="Top Districts"
          subtitle="Membership concentration"
          data={districtData.map((item) => ({ name: item.district, value: item.count }))}
          emptyMessage="No district data available."
        />

        <AnalyticsPieCard
          title="Gender Distribution"
          subtitle="Member split by gender"
          data={genderData}
          emptyMessage="No gender data available."
        />
      </div>

      {/* Members Table */}
      <DataTable
        title="All Members"
        columns={memberColumns}
        data={members.map((member) => ({
          ...member,
          dob: member.dob
            ? new Date(member.dob).toLocaleDateString("en-GB")
            : "",
          submitted_at: member.submitted_at
            ? new Date(member.submitted_at).toLocaleDateString("en-GB")
            : "",
          interests: Array.isArray(member.interests)
            ? member.interests.join(", ")
            : member.interests || "",
        }))}
        onAdd={handleAddMember}
        onEdit={handleEditMember}
        onView={handleViewMember}
        onDelete={handleDeleteMember}
        searchPlaceholder="Search members..."
      />

      {/* Yuva Shakthi Modal */}
      <YuvaShakthiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        memberData={selectedMember}
        onSave={handleSaveMember}
      />
    </div>
  );
}

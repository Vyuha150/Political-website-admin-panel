"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsBarCard, AnalyticsPieCard } from "@/components/ui/analytics-charts";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { UserModal } from "@/components/modals/user-model";

const userColumns = [
  { key: "name", label: "Name" },
  { key: "mobile", label: "Mobile" },
  { key: "gender", label: "Gender" },
  { key: "role", label: "Role" }, // <-- Added role column
  { key: "created_at", label: "Joined Date" },
  { key: "status", label: "Status" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedUser, setSelectedUser] = useState<any | undefined>(undefined);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, mobile, role, gender, created_at");
    if (error) {
      console.error(error);
      setUsers([]);
    } else {
      setUsers(
        data.map((user: any) => ({
          ...user,
          created_at: new Date(user.created_at)
            .toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .replace(/ /g, "-"),
          status: "Active",
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const activeUsers = users.filter((user) => user.status === "Active").length;
  const inactiveUsers = users.filter(
    (user) => user.status === "Inactive"
  ).length;

  const roleData = Object.entries(
    users.reduce((acc: Record<string, number>, user) => {
      const key = user.role || "citizen";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const genderData = Object.entries(
    users.reduce((acc: Record<string, number>, user) => {
      const key = user.gender || "Not Specified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([gender, count]) => ({ gender, count }));

  // Modal handlers
  const handleAddUser = () => {
    setModalMode("add");
    setSelectedUser(undefined);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: any) => {
    setModalMode("edit");
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleViewUser = (user: any) => {
    setModalMode("view");
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Add, Update, Delete API integration
  const handleSaveUser = async (data: any) => {
    if (modalMode === "add") {
      const res = await fetch("/api/admin-create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          mobile: data.mobile,
          gender: data.gender,
          role: data.role,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert("Error: " + result.error);
        return;
      }
      fetchUsers();
    } else if (modalMode === "edit" && selectedUser?.id) {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          mobile: data.mobile,
          gender: data.gender,
          role: data.role, // <-- Add role here
        })
        .eq("id", selectedUser.id);
      if (error) alert("Error updating user: " + error.message);
    }
    setIsModalOpen(false);
  };

  const handleDeleteUser = async (user: any) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);
      if (error) {
        alert("Error deleting user: " + error.message);
      } else {
        fetchUsers();
      }
    }
  };

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-gray-600 text-lg">
          Manage registered users and their profiles
        </p>
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Users"
          value={users.length}
          description="All registered users"
          icon={Users}
          color="orange"
        />
        <OverviewCard
          title="Active Users"
          value={activeUsers}
          description="Currently active"
          icon={UserCheck}
          color="yellow"
        />
        <OverviewCard
          title="Inactive Users"
          value={inactiveUsers}
          description="Inactive accounts"
          icon={UserX}
          color="red"
        />
        <OverviewCard
          title="New This Month"
          value={
            users.filter(
              (u) => new Date(u.created_at).getMonth() === new Date().getMonth()
            ).length
          }
          description="Recent registrations"
          icon={Clock}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsPieCard
          title="Users by Role"
          subtitle="Role composition"
          data={roleData}
          emptyMessage="No role data available."
        />

        <AnalyticsBarCard
          title="Users by Gender"
          subtitle="Demographic split"
          data={genderData.map((entry) => ({ name: entry.gender, value: entry.count }))}
          emptyMessage="No gender data available."
        />
      </div>

      {/* Users Table */}
      <DataTable
        title="All Users"
        columns={userColumns}
        data={users.map((user) => ({
          ...user,
          roleBadge: (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                user.role === "admin"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : user.role === "staff"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
            </span>
          ),
          status: (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                user.status === "Active"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }`}
            >
              {user.status}
            </span>
          ),
        }))}
        onAdd={handleAddUser}
        onEdit={handleEditUser}
        onView={handleViewUser}
        onDelete={handleDeleteUser}
        searchPlaceholder="Search users..."
      />

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        userData={selectedUser}
        onSave={handleSaveUser}
      />
    </div>
  );
}

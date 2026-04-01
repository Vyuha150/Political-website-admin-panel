"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsBarCard, AnalyticsPieCard, AnalyticsVerticalBarCard } from "@/components/ui/analytics-charts";
import { supabase } from "@/lib/supabaseClient";
import { User, Users, Phone, Clock } from "lucide-react";

interface CitizenProfile {
  id: string;
  name: string | null;
  mobile: string | null;
  gender: string | null;
  role: string | null;
  created_at: string;
}

const citizenColumns = [
  { key: "name", label: "Name" },
  { key: "mobile", label: "Mobile" },
  { key: "gender", label: "Gender" },
  { key: "created_at", label: "Joined Date" },
];

export default function CitizensPage() {
  const [citizens, setCitizens] = useState<CitizenProfile[]>([]);

  const fetchCitizens = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, mobile, gender, role, created_at")
      .eq("role", "citizen")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setCitizens([]);
      return;
    }

    setCitizens((data as CitizenProfile[]) || []);
  };

  useEffect(() => {
    fetchCitizens();
  }, []);

  const thisMonthCitizens = citizens.filter((citizen) => {
    const joined = new Date(citizen.created_at);
    const now = new Date();
    return (
      joined.getMonth() === now.getMonth() &&
      joined.getFullYear() === now.getFullYear()
    );
  }).length;

  const genderData = Object.entries(
    citizens.reduce((acc: Record<string, number>, citizen) => {
      const key = citizen.gender || "Not Specified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([gender, count]) => ({ gender, count }));

  const registrations7Days = (() => {
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
    citizens.forEach((citizen) => {
      if (!citizen.created_at) return;
      const key = new Date(citizen.created_at).toISOString().split("T")[0];
      const item = lookup.get(key);
      if (item) item.count += 1;
    });

    return days;
  })();

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Citizens
        </h1>
        <p className="text-gray-600 text-lg">
          View citizen accounts registered on the portal
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Citizens"
          value={citizens.length}
          description="Citizen accounts"
          icon={Users}
          color="yellow"
        />
        <OverviewCard
          title="New This Month"
          value={thisMonthCitizens}
          description="Recent registrations"
          icon={Clock}
          color="orange"
        />
        <OverviewCard
          title="With Mobile"
          value={citizens.filter((citizen) => !!citizen.mobile).length}
          description="Profiles with phone"
          icon={Phone}
          color="purple"
        />
        <OverviewCard
          title="Named Profiles"
          value={citizens.filter((citizen) => !!citizen.name).length}
          description="Profiles with names"
          icon={User}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsPieCard
          title="Citizens by Gender"
          subtitle="Profile demographic split"
          data={genderData.map((item) => ({ name: item.gender, value: item.count }))}
          emptyMessage="No gender data available."
        />

        <AnalyticsVerticalBarCard
          title="Registrations (7 Days)"
          subtitle="Recent sign-up trend"
          data={registrations7Days.map((item) => ({ name: item.day, value: item.count }))}
          emptyMessage="No registration trend data available."
        />
      </div>

      <DataTable
        title="Citizen Directory"
        columns={citizenColumns}
        data={citizens.map((citizen) => ({
          ...citizen,
          created_at: citizen.created_at
            ? new Date(citizen.created_at)
                .toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
                .replace(/ /g, "-")
            : "-",
        }))}
        searchPlaceholder="Search citizens..."
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { OverviewCard } from "@/components/ui/overview-card";
import { DataTable } from "@/components/ui/data-table";
import { AnalyticsPieCard, AnalyticsVerticalBarCard } from "@/components/ui/analytics-charts";
import { supabase } from "@/lib/supabaseClient";
import { MessageCircle, MapPin, AlertTriangle, Clock } from "lucide-react";

interface CitizenFeedbackRow {
  id: string;
  name?: string | null;
  mobile?: string | null;
  area?: string | null;
  roads_condition?: string | null;
  power_issues?: string | null;
  water_supply?: string | null;
  drainage_system?: string | null;
  public_transport?: string | null;
  infrastructure_satisfaction?: string | null;
  scheme_awareness?: string | null;
  scheme_benefits?: string | null;
  scheme_satisfaction?: string | null;
  education_facilities?: string | null;
  education_satisfaction?: string | null;
  employment_opportunities?: string | null;
  employment_satisfaction?: string | null;
  healthcare_access?: string | null;
  accessibility_satisfaction?: string | null;
  issues_heard?: string | null;
  leadership_satisfaction?: string | null;
  priority_issue?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
}

const feedbackColumns = [
  { key: "name", label: "Name" },
  { key: "mobile", label: "Mobile" },
  { key: "area", label: "Area" },
  { key: "priority_issue", label: "Priority Issue" },
  { key: "roads_condition", label: "Roads" },
  { key: "power_issues", label: "Power" },
  { key: "water_supply", label: "Water" },
  { key: "healthcare_access", label: "Healthcare" },
  { key: "employment_opportunities", label: "Employment" },
  { key: "leadership_satisfaction", label: "Leadership Satisfaction" },
  { key: "submitted_at", label: "Submitted" },
];

function getFeedbackDate(row: CitizenFeedbackRow) {
  return row.submitted_at || row.created_at || "";
}

export default function CitizenFeedbackPage() {
  const [feedback, setFeedback] = useState<CitizenFeedbackRow[]>([]);

  const fetchFeedback = async () => {
    const { data, error } = await supabase.from("citizen_feedback").select("*");

    if (error) {
      console.error(error);
      setFeedback([]);
      return;
    }

    const rows = ((data || []) as CitizenFeedbackRow[]).sort((a, b) => {
      return new Date(getFeedbackDate(b)).getTime() - new Date(getFeedbackDate(a)).getTime();
    });

    setFeedback(rows);
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const totalFeedback = feedback.length;
  const withMobile = feedback.filter((item) => !!item.mobile).length;
  const withArea = feedback.filter((item) => !!item.area).length;
  const distinctPriorityIssues = new Set(
    feedback.map((item) => item.priority_issue).filter(Boolean)
  ).size;

  const priorityIssueData = Object.entries(
    feedback.reduce((acc: Record<string, number>, item) => {
      const key = item.priority_issue || "Unspecified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const submissionTrend = (() => {
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

    const lookup = new Map(days.map((entry) => [entry.key, entry]));

    feedback.forEach((item) => {
      const sourceDate = getFeedbackDate(item);
      if (!sourceDate) return;
      const key = new Date(sourceDate).toISOString().split("T")[0];
      const entry = lookup.get(key);
      if (entry) {
        entry.count += 1;
      }
    });

    return days;
  })();

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Citizen Feedback
        </h1>
        <p className="text-gray-600 text-lg">
          Review digital vote submissions from the MLA website
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Feedback"
          value={totalFeedback}
          description="All submitted votes"
          icon={MessageCircle}
          color="yellow"
        />
        <OverviewCard
          title="With Mobile"
          value={withMobile}
          description="Contactable responses"
          icon={Clock}
          color="orange"
        />
        <OverviewCard
          title="With Area"
          value={withArea}
          description="Location tagged"
          icon={MapPin}
          color="purple"
        />
        <OverviewCard
          title="Priority Issues"
          value={distinctPriorityIssues}
          description="Unique concern categories"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnalyticsPieCard
          title="Priority Issues"
          subtitle="Most common citizen concerns"
          data={priorityIssueData}
          emptyMessage="No priority issue data available."
        />

        <AnalyticsVerticalBarCard
          title="Submissions (7 Days)"
          subtitle="Recent digital vote activity"
          data={submissionTrend.map((item) => ({ name: item.day, value: item.count }))}
          emptyMessage="No submission trend data available."
        />
      </div>

      <DataTable
        title="Citizen Feedback Submissions"
        columns={feedbackColumns}
        data={feedback.map((item) => ({
          ...item,
          submitted_at: getFeedbackDate(item)
            ? new Date(getFeedbackDate(item)).toISOString().split("T")[0]
            : "",
          roads_condition: item.roads_condition || "-",
          power_issues: item.power_issues || "-",
          water_supply: item.water_supply || "-",
          healthcare_access: item.healthcare_access || "-",
          employment_opportunities: item.employment_opportunities || "-",
          leadership_satisfaction: item.leadership_satisfaction || "-",
        }))}
        searchPlaceholder="Search feedback submissions..."
      />
    </div>
  );
}
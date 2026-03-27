import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getReportConfigById, getFullReportData, getAllReportsData } from "@/data/reportsConfig";

export type ReportRow = Tables<"reports">;

// Extended report type with student and team info
export interface ReportWithDetails extends ReportRow {
  studentId: string;
  studentName: string;
  teamId: string;
  teamName: string;
}

// ============= Queries =============

export const useReports = () => {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async (): Promise<ReportRow[]> => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

// Reports with student and team details joined
export const useReportsWithDetails = () => {
  return useQuery({
    queryKey: ["reports", "with-details"],
    queryFn: async (): Promise<ReportWithDetails[]> => {
      // Fetch reports
      const { data: reports, error: reportsError } = await supabase
        .from("reports")
        .select("*")
        .order("date", { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch students
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, name, team_id");

      if (studentsError) throw studentsError;

      // Fetch teams
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name");

      if (teamsError) throw teamsError;

      // Join data
      const result = (reports || []).map((report) => {
        const student = (students || []).find((s) => s.id === report.student_id);
        const team = student ? (teams || []).find((t) => t.id === student.team_id) : null;

        return {
          ...report,
          studentId: report.student_id,
          studentName: student?.name || "",
          teamId: student?.team_id || "",
          teamName: team?.name || "",
        };
      });

      // Fallback: merge mock data if Supabase has no reports
      if (result.length === 0) {
        const mockReports = getAllReportsData();
        return mockReports.map((r) => ({
          id: r.id,
          date: r.date,
          student_id: r.studentId,
          type: r.type as ReportRow["type"],
          title: null,
          module_config: null,
          markdown_notes: null,
          student_snapshot: null,
          coach_id: null,
          created_at: r.date,
          updated_at: r.date,
          report_date: r.date,
          audio_file_url: null,
          chart_data: null,
          studentId: r.studentId,
          studentName: r.studentName,
          teamId: r.teamId,
          teamName: r.teamName,
        })) as ReportWithDetails[];
      }

      return result;
    },
  });
};

// Default module sets by report type (used when Supabase report has no module_config)
const DEFAULT_BATTING_MODULES = {
  modules: [
    { module_id: "batting_3_0", module_name: "打擊概況摘要", order: 1 },
    { module_id: "batting_3_1", module_name: "擊球仰角 / 初速趨勢圖", order: 2 },
    { module_id: "batting_3_4", module_name: "擊球落點與強勁程度場地圖", order: 3 },
    { module_id: "batting_3_7", module_name: "好球帶熱區圖", order: 4 },
    { module_id: "batting_3_6", module_name: "打擊選手個人及層級數據分佈圖", order: 5 },
  ],
};

const DEFAULT_PITCHING_MODULES = {
  modules: [
    { module_id: "pitching_4_1", module_name: "投球選手層級數據分佈圖", order: 1 },
    { module_id: "pitching_4_2", module_name: "球路位移圖", order: 2 },
    { module_id: "pitching_4_3", module_name: "進壘點散佈圖", order: 3 },
    { module_id: "pitching_4_4", module_name: "出手點散佈圖", order: 4 },
  ],
};

const DEFAULT_FITNESS_MODULES = {
  modules: [
    { module_id: "batting_3_5", module_name: "攻擊角度 / 揮擊時間散佈圖", order: 1 },
    { module_id: "batting_3_6", module_name: "打擊選手個人及層級數據分佈圖", order: 2 },
  ],
};

function getDefaultModulesByType(type: string | null) {
  if (type === "打擊") return DEFAULT_BATTING_MODULES;
  if (type === "投球") return DEFAULT_PITCHING_MODULES;
  if (type === "體測") return DEFAULT_FITNESS_MODULES;
  return DEFAULT_BATTING_MODULES;
}

export const useReportById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: async (): Promise<ReportRow | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        // If module_config is missing, auto-assign default modules by report type
        if (!data.module_config) {
          const defaultModules = getDefaultModulesByType(data.type);
          return { ...data, module_config: defaultModules as Record<string, unknown> };
        }
        return data;
      }

      // Fallback to mock config data for development
      const config = getReportConfigById(id);
      if (!config) return null;
      const fullData = getFullReportData(config);
      return {
        id: config.id,
        date: config.date,
        student_id: config.studentId,
        type: config.type as ReportRow["type"],
        title: config.title || null,
        module_config: (config.module_config as Record<string, unknown>) || null,
        markdown_notes: config.markdown_notes || null,
        student_snapshot: { name: fullData.studentName, team: fullData.teamName },
        coach_id: null,
        created_at: config.date,
        updated_at: config.date,
        report_date: config.date,
        audio_file_url: null,
        chart_data: null,
      } as ReportRow;
    },
    enabled: !!id,
  });
};

export const useReportsByStudent = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["reports", "student", studentId],
    queryFn: async (): Promise<ReportRow[]> => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });
};

// ============= Mutations =============

export const useAddReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      date: string;
      student_id: string;
      type: ReportRow["type"];
    }) => {
      const { error } = await supabase.from("reports").insert(data);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      date?: string;
      student_id?: string;
      type?: ReportRow["type"];
    }) => {
      const { id, ...updates } = data;
      const { error } = await supabase.from("reports").update(updates).eq("id", id);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports", variables.id] });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

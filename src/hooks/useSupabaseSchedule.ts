import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ScheduleEventRow = Tables<"schedule_events">;

// Full schedule event with joined data
export interface ScheduleEventWithDetails {
  id: string;
  date: string;
  courseId: string;
  courseName: string;
  courseColor: string;
  courseType: "public" | "personal";
  studentId: string;
  studentName: string;
  teamId: string;
  teamName: string;
  highlight: boolean;
}

// Events grouped by date (YYYY-MM-DD format)
export type ScheduleEventsType = Record<string, ScheduleEventWithDetails[]>;

// Helper function to fetch course details for both public and personal courses
const fetchCourseDetails = async (courseIds: string[], courseType: "public" | "personal"): Promise<Record<string, { name: string; color: string }>> => {
  if (courseIds.length === 0) return {};
  
  const tableName = courseType === "public" ? "training_courses" : "personal_courses";
  const { data, error } = await supabase
    .from(tableName)
    .select("id, name, color")
    .in("id", courseIds);
  
  if (error) throw error;
  
  const map: Record<string, { name: string; color: string }> = {};
  (data || []).forEach((course: any) => {
    map[course.id] = { name: course.name, color: course.color || "default" };
  });
  return map;
};

// Process raw events and add course details
const processEventsWithCourseDetails = async (
  rawEvents: any[]
): Promise<ScheduleEventWithDetails[]> => {
  if (rawEvents.length === 0) return [];

  // Separate events by course type
  const publicCourseIds = rawEvents
    .filter(e => e.course_type === "public" || !e.course_type)
    .map(e => e.course_id);
  const personalCourseIds = rawEvents
    .filter(e => e.course_type === "personal")
    .map(e => e.course_id);

  // Fetch course details in parallel
  const [publicCourses, personalCourses] = await Promise.all([
    fetchCourseDetails([...new Set(publicCourseIds)], "public"),
    fetchCourseDetails([...new Set(personalCourseIds)], "personal"),
  ]);

  return rawEvents.map((event: any) => {
    const courseType = (event.course_type || "public") as "public" | "personal";
    const courseMap = courseType === "public" ? publicCourses : personalCourses;
    const courseDetails = courseMap[event.course_id] || { name: "", color: "default" };

    return {
      id: event.id,
      date: event.date,
      courseId: event.course_id,
      courseName: courseDetails.name,
      courseColor: courseDetails.color,
      courseType,
      studentId: event.student_id,
      studentName: event.students?.name || "",
      teamId: event.students?.team_id || "",
      teamName: event.students?.teams?.name || "",
      highlight: event.highlight || false,
    };
  });
};

// ============= Schedule Events Queries =============

export const useScheduleEvents = () => {
  return useQuery({
    queryKey: ["schedule_events"],
    queryFn: async (): Promise<ScheduleEventsType> => {
      const { data, error } = await supabase
        .from("schedule_events")
        .select(`
          *,
          students!inner(name, team_id, teams(name))
        `)
        .order("date");

      if (error) throw error;

      const processedEvents = await processEventsWithCourseDetails(data || []);
      
      const result: ScheduleEventsType = {};
      processedEvents.forEach((event) => {
        const dateKey = event.date;
        if (!result[dateKey]) result[dateKey] = [];
        result[dateKey].push(event);
      });

      return result;
    },
  });
};

export const useScheduleEventsByStudent = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["schedule_events", "student", studentId],
    queryFn: async (): Promise<ScheduleEventsType> => {
      if (!studentId) return {};

      const { data, error } = await supabase
        .from("schedule_events")
        .select(`
          *,
          students!inner(name, team_id, teams(name))
        `)
        .eq("student_id", studentId)
        .order("date");

      if (error) throw error;

      const processedEvents = await processEventsWithCourseDetails(data || []);
      
      const result: ScheduleEventsType = {};
      processedEvents.forEach((event) => {
        const dateKey = event.date;
        if (!result[dateKey]) result[dateKey] = [];
        result[dateKey].push(event);
      });

      return result;
    },
    enabled: !!studentId,
  });
};

export const useScheduleEventsByTeam = (teamId: string | undefined) => {
  return useQuery({
    queryKey: ["schedule_events", "team", teamId],
    queryFn: async (): Promise<ScheduleEventsType> => {
      if (!teamId) return {};

      const { data, error } = await supabase
        .from("schedule_events")
        .select(`
          *,
          students!inner(name, team_id, teams(name))
        `)
        .order("date");

      if (error) throw error;

      // Filter by team
      const filteredData = (data || []).filter(
        (event: any) => event.students?.team_id === teamId
      );

      const processedEvents = await processEventsWithCourseDetails(filteredData);
      
      const result: ScheduleEventsType = {};
      processedEvents.forEach((event) => {
        const dateKey = event.date;
        if (!result[dateKey]) result[dateKey] = [];
        result[dateKey].push(event);
      });

      return result;
    },
    enabled: !!teamId,
  });
};

// Get events for a specific month (for calendar display)
export const useScheduleEventsByMonth = (year: number, month: number) => {
  return useQuery({
    queryKey: ["schedule_events", "month", year, month],
    queryFn: async (): Promise<Record<number, ScheduleEventWithDetails[]>> => {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      // Calculate last day of month correctly
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("schedule_events")
        .select(`
          *,
          students!inner(name, team_id, teams(name))
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date");

      if (error) throw error;

      const processedEvents = await processEventsWithCourseDetails(data || []);

      const result: Record<number, ScheduleEventWithDetails[]> = {};
      processedEvents.forEach((event) => {
        const day = parseInt(event.date.split("-")[2], 10);
        if (!result[day]) result[day] = [];
        result[day].push(event);
      });

      return result;
    },
  });
};

// ============= Mutations =============

export const useAddScheduleEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      date: string;
      course_id: string;
      student_id: string;
      course_type?: "public" | "personal";
      highlight?: boolean;
    }) => {
      const { error } = await supabase.from("schedule_events").insert({
        ...data,
        course_type: data.course_type || "public",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_events"] });
    },
  });
};

export const useUpdateScheduleEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      date?: string;
      course_id?: string;
      student_id?: string;
      course_type?: "public" | "personal";
      highlight?: boolean;
    }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from("schedule_events")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_events"] });
    },
  });
};

export const useDeleteScheduleEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_events").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_events"] });
    },
  });
};

// Bulk operations for schedule editing
export const useBulkUpdateScheduleEvents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (operations: {
      add: { date: string; course_id: string; student_id: string; course_type?: "public" | "personal"; highlight?: boolean }[];
      delete: string[];
    }) => {
      // Delete events
      if (operations.delete.length > 0) {
        const { error: deleteError } = await supabase
          .from("schedule_events")
          .delete()
          .in("id", operations.delete);

        if (deleteError) throw deleteError;
      }

      // Add new events with course_type
      if (operations.add.length > 0) {
        const eventsToAdd = operations.add.map(e => ({
          ...e,
          course_type: e.course_type || "public",
        }));
        
        const { error: addError } = await supabase
          .from("schedule_events")
          .insert(eventsToAdd);

        if (addError) throw addError;
      }

      return operations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_events"] });
    },
  });
};

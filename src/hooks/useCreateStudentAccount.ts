import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateStudentAccountData {
  name: string;
  email: string;
  team_id?: string;
  position?: string;
  height?: string;
  weight?: string;
  birthday?: string;
  throwing_hand?: string;
  batting_hand?: string;
  player_type?: string;
  responsibleCoachIds?: string[];
}

interface CreateStudentAccountResponse {
  success: boolean;
  message: string;
  studentId: string;
  authUserId: string;
}

export const useCreateStudentAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStudentAccountData): Promise<CreateStudentAccountResponse> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("未登入");
      }

      const response = await supabase.functions.invoke("create-student-account", {
        body: data,
      });

      if (response.error) {
        throw new Error(response.error.message || "建立帳號失敗");
      }

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || "建立帳號失敗");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateAccountInput {
  id: string;
  name: string;
  email: string;
  role_id: string;
  active: boolean;
  teams?: string[];
}

interface CreateAccountResponse {
  success: boolean;
  account: {
    id: string;
    name: string;
    email: string;
    role_id: string;
    active: boolean;
    auth_user_id: string;
  };
}

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAccountInput): Promise<CreateAccountResponse> => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("未登入");
      }

      const response = await supabase.functions.invoke<CreateAccountResponse>("create-account", {
        body: input,
      });

      if (response.error) {
        throw new Error(response.error.message || "建立帳號失敗");
      }

      if (!response.data?.success) {
        throw new Error((response.data as any)?.error || "建立帳號失敗");
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate accounts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

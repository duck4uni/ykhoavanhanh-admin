import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { apiPost } from "@/lib/axios";

export interface AdminUserRole {
  id: string;
  role_id: string;
  role: {
    id: string;
    role_name: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  phone: string;
  full_name: string | null;
  address: string | null;
  birthday: string | null;
  cccd: string | null;
  avatar: string | null;
  is_admin: boolean;
  is_active: boolean;
  zalo_id: string | null;
  zalo_avatar: string | null;
  zalo_id_by_oa: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  user_roles?: AdminUserRole[];
}

export interface CreateAdminUserPayload {
  email: string;
  phone: string;
  password: string;
  full_name?: string;
  address?: string;
  birthday?: string;
  cccd?: string;
  avatar?: string;
  is_admin?: boolean;
  is_active?: boolean;
  role_id?: string;
}

type AdminUserResponse<T> = {
  status?: "success" | "fail";
  success?: boolean;
  responseData?: T | null;
  data?: T | null;
  message?: string;
  message_en?: string;
};

export const adminUsersKeys = {
  all: ["admin-users"] as const,
};

export const adminUsersService = {
  create: async (payload: CreateAdminUserPayload): Promise<AdminUser> => {
    const res = await apiPost<AdminUser>("/users/admin", payload);
    const data = res.data as AdminUserResponse<AdminUser>;
    const responseData = data.responseData ?? data.data;

    if ((data.status === "success" || data.success === true) && responseData) {
      return responseData;
    }

    throw new Error(data.message || "Tạo bệnh nhân thất bại");
  },
};

export function useCreateAdminUser(
  options?: UseMutationOptions<AdminUser, Error, CreateAdminUserPayload>
) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, ...rest } = options ?? {};

  return useMutation<AdminUser, Error, CreateAdminUserPayload>({
    mutationFn: (payload) => adminUsersService.create(payload),
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      onSuccess?.(data, variables, context, mutation);
    },
    onError: (error, variables, context, mutation) => {
      onError?.(error, variables, context, mutation);
    },
    ...rest,
  });
}

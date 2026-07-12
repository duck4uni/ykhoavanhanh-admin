// API Types matching backend response format

export interface ApiResponse<T> {
  status: "success" | "fail";
  responseData: T | null;
  message?: string;
  message_en?: string;
  violations?: Array<{ message: string }>;
  timeStamp: string;
}
export interface ErrorResponse {
  status: "fail";
  message: string;
  message_en?: string;
  violations?: Array<{ message: string }>;
  responseData: null;
  timeStamp: string;
}
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  phone: string;
  full_name: string;
  password: string;
}

export interface ZaloLoginPayload {
  phone: string;
  full_name: string;
  zalo_id: string;
  zalo_avatar?: string;
  zalo_id_by_oa?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
  role: {
    id: string;
    role_name: string;
    description: string | null;
    receptionist: boolean;
    membership: boolean;
    marketing: boolean;
    accountant: boolean;
    customer_service: boolean;
  };
}

export interface User {
  id: string;
  phone?: string;
  full_name?: string;
  email?: string;
  cccd?: string;
  avatar?: string;
  is_active?: boolean;
  is_admin?: boolean;
  createdAt?: string;
  updatedAt?: string;
  user_roles?: UserRole[];
}
export interface usePut{

    full_name: string,
    phone: string,
    avatar: string,
    created_at: string,
    created_by: string,
    updated_at: string,
    updated_by: string

}
export interface usePutResponse{}
export interface PaginatedResponse<T> {
  count?: number;
  rows?: T[];
  totalPages?: number;
  currentPage?: number;
}

export interface PaginationParams {
  page?: number;
  currentPage?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
  filters?: string;
}



// Query Key factories for TanStack Query
export const queryKeys = {
  all: ["api"] as const,
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params?: PaginationParams) => [...queryKeys.users.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
  },
  doctors: {
    all: ["doctors"] as const,
    list: () => [...queryKeys.doctors.all, "list"] as const,
  },
  rooms: {
    all: ["rooms"] as const,
    list: () => [...queryKeys.rooms.all, "list"] as const,
  },
  services: {
    all: ["his-services"] as const,
    list: () => [...queryKeys.services.all, "list"] as const,
  },
  appointments: {
    all: ["appointments"] as const,
    list: (params?: Record<string, string>) => [...queryKeys.appointments.all, "list", params] as const,
  },
  carousel: {
    all: ["carousel"] as const,
    list: () => [...queryKeys.carousel.all, "list"] as const,
  },
  chatData: {
    all: ["chatData"] as const,
    list: () => [...queryKeys.chatData.all, "list"] as const,
  },
};

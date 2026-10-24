// Re-export từ permissions
export type { RoleType, Permission } from './permissions';
export { ROLE_LABELS, PERMISSION_LABELS, DEFAULT_ROLE_PERMISSIONS } from './permissions';

export type AdminRole =
  | "super_admin"       // Cấu hình toàn hệ thống
  | "admin_content"     // Quản lý bài viết/tin tức
  | "admin_membership"  // Quản lý điểm/quà/voucher
  | "cskh"              // Nhân viên CSKH xác nhận lịch, tư vấn
  | "doctor";           // Bác sĩ xem lịch khám

export interface AdminUserRole {
  id: string;
  roleId: string;
  roleName: string;
  description: string | null;
  receptionist: boolean;
  membership: boolean;
  marketing: boolean;
  accountant: boolean;
  customerService: boolean;
}

// API Response User Role (từ backend)
export interface ApiUserRole {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    is_admin: boolean;
  };
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

// Role cho dropdown - sử dụng role_type để phân biệt
export interface RoleOption {
  id: string;
  role_name: string;
  description: string | null;
  role_type: 'admin' | 'accountant' | 'cskh' | 'marketing' | 'receptionist';
  // Các flag boolean để backward compatibility
  receptionist?: boolean;
  membership?: boolean;
  marketing?: boolean;
  accountant?: boolean;
  customer_service?: boolean;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  /**
   * Union legacy, chỉ đặt được chắc chắn cho super admin. Với nhân viên nội bộ
   * là `undefined` — hiển thị vai trò thật qua `userRoles[].roleName`.
   */
  role?: AdminRole;
  avatar?: string;
  isActive: boolean;
  is_admin?: boolean; // Super Admin - có tất cả quyền
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  userRoles?: AdminUserRole[];
  // Thêm trường để lưu roles từ API
  apiUserRoles?: ApiUserRole[];
}

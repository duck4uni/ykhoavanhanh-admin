import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserById, useUpdateUser } from "@/api/userApi";
import { useRolesList } from "@/api/rolesApi";
import { useUserRolesList, useCreateUserRole, useDeleteUserRole } from "@/api/userRolesApi";
import { toast } from "@/components/ui/Toast";

export interface RoleChange {
  type: "add" | "remove";
  roleId: string;
  roleName: string;
}

/** State + logic cho trang chỉnh sửa người dùng (thông tin + vai trò). */
export function useEditUserForm() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    cccd: "",
    phone: "",
    isActive: true,
  });
  const [pendingRoleChanges, setPendingRoleChanges] = useState<RoleChange[]>([]);

  const { data: apiUser, isLoading: userLoading } = useUserById(userId);
  const { data: rolesData, isLoading: rolesLoading } = useRolesList({ pageSize: 100 });
  const { data: userRolesData, isLoading: userRolesLoading } = useUserRolesList({ user_id: userId, pageSize: 100 });

  const updateUser = useUpdateUser({
    onSuccess: () => {
      toast.success("Cap nhat thong tin thanh cong!");
      router.push(`/users/${userId}`);
    },
    onError: (error) => toast.error(error.message || "Cap nhat that bai"),
  });

  const addRoleMutation = useCreateUserRole({
    onSuccess: () => {},
    onError: (error) => toast.error(error.message || "Gan vai tro that bai"),
  });

  const removeRoleMutation = useDeleteUserRole({
    onSuccess: () => {},
    onError: (error) => toast.error(error.message || "Go vai tro that bai"),
  });

  useEffect(() => {
    if (apiUser && !updateUser.isPending) {
      setForm({
        fullName: apiUser.full_name ?? "",
        cccd: apiUser.cccd ?? "",
        phone: apiUser.phone ?? "",
        isActive: apiUser.is_active ?? true,
      });
    }
  }, [apiUser, updateUser.isPending]);

  const currentRoleIds = useMemo(() => {
    const currentIds = new Set(userRolesData?.rows.map((ur) => ur.role_id) || []);
    pendingRoleChanges.filter((c) => c.type === "remove").forEach((c) => currentIds.delete(c.roleId));
    return currentIds;
  }, [userRolesData, pendingRoleChanges]);

  const availableRoles = useMemo(() => {
    if (!rolesData?.rows) return [];
    const pendingAddIds = new Set(pendingRoleChanges.filter((c) => c.type === "add").map((c) => c.roleId));
    return rolesData.rows.filter((role) => !currentRoleIds.has(role.id) && !pendingAddIds.has(role.id));
  }, [rolesData, currentRoleIds, pendingRoleChanges]);

  const displayRoles = useMemo(() => {
    if (!userRolesData?.rows) return [];
    const pendingRemoveIds = new Set(pendingRoleChanges.filter((c) => c.type === "remove").map((c) => c.roleId));
    return userRolesData.rows.filter((ur) => !pendingRemoveIds.has(ur.role_id));
  }, [userRolesData, pendingRoleChanges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    updateUser.mutate({
      id: userId,
      payload: {
        full_name: form.fullName,
        cccd: form.cccd,
        phone: form.phone,
        is_active: form.isActive,
      },
    });

    for (const change of pendingRoleChanges) {
      if (change.type === "add") {
        addRoleMutation.mutate({ user_id: userId, role_id: change.roleId });
      } else {
        const userRole = userRolesData?.rows.find((ur) => ur.role_id === change.roleId);
        if (userRole) removeRoleMutation.mutate(userRole.id);
      }
    }

    setPendingRoleChanges([]);
  };

  const handleToggleRole = (roleId: string, roleName: string, isCurrentlyAssigned: boolean) => {
    setPendingRoleChanges((prev) => {
      const existing = prev.find((c) => c.roleId === roleId);
      if (existing) return prev.filter((c) => c.roleId !== roleId);
      return [...prev, { type: isCurrentlyAssigned ? "remove" : "add", roleId, roleName }];
    });
  };

  const isRolePending = (roleId: string) => pendingRoleChanges.some((c) => c.roleId === roleId);

  return {
    userId,
    router,
    form,
    setForm,
    apiUser,
    isLoading: userLoading || rolesLoading || userRolesLoading,
    isSaving: updateUser.isPending,
    displayRoles,
    availableRoles,
    pendingRoleChanges,
    handleSubmit,
    handleToggleRole,
    isRolePending,
  };
}

export type EditUserController = ReturnType<typeof useEditUserForm>;

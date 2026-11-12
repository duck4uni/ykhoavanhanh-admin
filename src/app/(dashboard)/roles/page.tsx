"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner, LoadingSection } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { useRolesList, useCreateRole, type ApiRole } from "@/api/rolesApi";
import {
  usePermissionsList,
  useRolePermissions,
  useUpdateRolePermissions,
  type ApiPermission,
} from "@/api/permissionsApi";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermission } from "@/hooks/usePermission";
import {
  PERMISSION_LABELS,
  isBackendEnforced,
  isNonGrantable,
  type Permission,
} from "@/types/permissions";
import { Check, Plus, RefreshCw, ShieldAlert, Users } from "lucide-react";

// Nhãn tiếng Việt cho `module` (tiền tố mã quyền) do backend trả về.
const MODULE_LABELS: Record<string, string> = {
  admin: "Quản trị hệ thống",
  accountant: "Kế toán",
  cskh: "CSKH",
  marketing: "Marketing",
  receptionist: "Tiếp tân",
  user: "Tài khoản & vai trò",
};

function moduleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module;
}

/** Nhóm danh mục quyền theo `module`, giữ thứ tự xuất hiện của MODULE_LABELS. */
function groupByModule(permissions: ApiPermission[]) {
  const order = Object.keys(MODULE_LABELS);
  const groups = new Map<string, ApiPermission[]>();

  for (const perm of permissions) {
    const list = groups.get(perm.module) ?? [];
    list.push(perm);
    groups.set(perm.module, list);
  }

  return [...groups.entries()].sort(
    ([a], [b]) =>
      (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) -
      (order.indexOf(b) === -1 ? 999 : order.indexOf(b)),
  );
}

/** Badge nhỏ cho mã quyền backend chưa thực sự kiểm tra. */
function NotEnforcedBadge() {
  return (
    <span
      title="Backend chưa kiểm tra mã quyền này — API tương ứng vẫn chỉ cho admin tổng, cấp quyền ở đây chỉ hiện menu trên FE."
      className="ml-1 whitespace-nowrap rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
    >
      chưa áp dụng ở API
    </span>
  );
}

/** Màu badge theo module trội nhất của vai trò — thuần trang trí, fallback trung tính. */
function badgeVariantForModule(module: string | null) {
  switch (module) {
    case "admin":
      return "danger" as const;
    case "accountant":
      return "warning" as const;
    case "cskh":
      return "info" as const;
    case "marketing":
      return "success" as const;
    default:
      return "default" as const;
  }
}

// ─── Error / empty states ────────────────────────────────────────────────────

function ErrorCard({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-destructive/10">
          <ShieldAlert className="size-6 text-destructive" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
        <p className="mb-4 max-w-md text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw data-icon="inline-start" className="size-4" />
            Thử lại
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── Create role modal ───────────────────────────────────────────────────────

function CreateRoleModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRoleName("");
      setDescription("");
      setError(null);
    }
  }, [isOpen]);

  const createMutation = useCreateRole({
    onSuccess: () => {
      toast.success("Tạo vai trò thành công");
      onClose();
    },
    onError: (err) => {
      setError(err.message);
      toast.error(err.message || "Tạo vai trò thất bại");
    },
  });

  const handleSave = () => {
    const name = roleName.trim();
    if (!name) {
      setError("Vui lòng nhập tên vai trò");
      return;
    }
    setError(null);
    createMutation.mutate({
      role_name: name,
      description: description.trim() || null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm vai trò"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="min-w-[100px]"
          >
            {createMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Đang tạo...
              </>
            ) : (
              "Tạo mới"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Tên vai trò *"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          placeholder="VD: ACCOUNTANT"
          error={error ?? undefined}
          hint="Tên định danh, không trùng với vai trò khác."
        />
        <Input
          label="Mô tả"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="VD: Kế toán"
        />
        <p className="text-xs text-muted-foreground">
          Sau khi tạo, dùng &quot;Chỉnh sửa quyền&quot; để gán quyền cho vai trò này.
        </p>
      </div>
    </Modal>
  );
}

// ─── Edit role permissions modal ─────────────────────────────────────────────

function EditPermissionsModal({
  role,
  catalog,
  onClose,
}: {
  role: ApiRole;
  catalog: ApiPermission[];
  onClose: () => void;
}) {
  const { data, isLoading, isError, error, refetch } = useRolePermissions(role.id);
  const [selected, setSelected] = useState<Set<Permission>>(new Set());

  // Nạp quyền hiện tại của vai trò khi query trả về.
  useEffect(() => {
    if (data?.permission_codes) {
      setSelected(new Set(data.permission_codes));
    }
  }, [data?.permission_codes]);

  // Mã không cấp qua UI (admin.all) mà vai trò ĐANG giữ. `PUT` là thay thế
  // nguyên khối nên phải gửi lại chúng, nếu không lưu một lần là mất quyền.
  const heldNonGrantable = useMemo<Permission[]>(
    () => (data?.permission_codes ?? []).filter(isNonGrantable),
    [data?.permission_codes],
  );

  const updateMutation = useUpdateRolePermissions({
    onSuccess: () => {
      toast.success("Cập nhật quyền thành công");
      onClose();
    },
    onError: (err) => toast.error(err.message || "Cập nhật quyền thất bại"),
  });

  // Bộ chọn chỉ hiện mã cấp được; admin.all được xử lý riêng (read-only) bên dưới.
  const grantableCatalog = useMemo(
    () => catalog.filter((p) => !isNonGrantable(p.code)),
    [catalog],
  );
  const grouped = useMemo(() => groupByModule(grantableCatalog), [grantableCatalog]);

  const toggle = (code: Permission) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleModule = (permissions: ApiPermission[]) => {
    const allChecked = permissions.every((p) => selected.has(p.code));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of permissions) {
        if (allChecked) next.delete(p.code);
        else next.add(p.code);
      }
      return next;
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      roleId: role.id,
      // Thay thế nguyên khối (atomic replace) — gửi tập đang chọn CỘNG các mã
      // legacy vai trò đang giữ nhưng không cấp được qua UI, để không âm thầm
      // xoá mất chúng.
      payload: {
        permission_codes: [...new Set([...selected, ...heldNonGrantable])],
      },
    });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Chỉnh sửa quyền — ${role.description || role.role_name}`}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Đã chọn {grantableCatalog.filter((p) => selected.has(p.code)).length}/
            {grantableCatalog.length} quyền
          </span>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={updateMutation.isPending || isLoading || isError}
              className="min-w-[100px]"
            >
              {updateMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <LoadingSection text="Đang tải quyền của vai trò..." />
      ) : isError ? (
        <div className="py-6 text-center">
          <p className="mb-4 text-sm text-destructive">
            {error?.message || "Không thể tải quyền của vai trò."}
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            <RefreshCw data-icon="inline-start" className="size-4" />
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Quyền quản trị tài khoản/vai trò chỉ thuộc admin tổng (cờ{" "}
            <code>is_admin</code>), không cấp được bằng mã quyền. Mã có nhãn{" "}
            <span className="font-medium">&quot;chưa áp dụng ở API&quot;</span> hiện chỉ
            mở menu trên giao diện, API tương ứng vẫn chưa kiểm tra quyền này.
          </p>

          {grouped.map(([module, permissions]) => {
            const allChecked = permissions.every((p) => selected.has(p.code));
            return (
              <div key={module} className="space-y-2">
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {moduleLabel(module)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleModule(permissions)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {allChecked ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {permissions.map((perm) => (
                    <label
                      key={perm.code}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selected.has(perm.code)}
                        onChange={() => toggle(perm.code)}
                      />
                      <span className="min-w-0">
                        <span className="block text-gray-800">
                          {perm.name}
                          {!isBackendEnforced(perm.code) && <NotEnforcedBadge />}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {perm.code}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Mã legacy vai trò đang giữ — hiện read-only để minh bạch, vẫn được
              gửi lại khi lưu (không âm thầm thu hồi). */}
          {heldNonGrantable.length > 0 && (
            <div className="space-y-2">
              <div className="border-b border-gray-200 pb-1.5">
                <h3 className="text-sm font-semibold text-gray-900">Mã cũ (không thay đổi được)</h3>
              </div>
              {heldNonGrantable.map((code) => (
                <div
                  key={code}
                  className="flex items-start gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm"
                >
                  <input type="checkbox" className="mt-0.5" checked disabled />
                  <span className="min-w-0">
                    <span className="block text-gray-500">
                      {PERMISSION_LABELS[code] ?? code}
                      <NotEnforcedBadge />
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {code} — vai trò đang giữ sẵn, được giữ nguyên khi lưu. Mã này
                      KHÔNG làm tài khoản thành admin tổng.
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Role card ───────────────────────────────────────────────────────────────

function RoleCard({
  role,
  onEdit,
}: {
  role: ApiRole;
  onEdit: () => void;
}) {
  const { data, isLoading, isError } = useRolePermissions(role.id);
  const codes = useMemo(() => data?.permission_codes ?? [], [data?.permission_codes]);

  // Module trội nhất chỉ để chọn màu badge; vai trò chưa có quyền → trung tính.
  // `admin.all` KHÔNG còn được coi là "toàn quyền" — nó chỉ là 1 mã như mọi mã khác.
  const dominantModule = useMemo(() => {
    const counts = new Map<string, number>();
    for (const code of codes) {
      const mod = code.split(".")[0];
      counts.set(mod, (counts.get(mod) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [mod, count] of counts) {
      if (count > bestCount) {
        best = mod;
        bestCount = count;
      }
    }
    return best;
  }, [codes]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">
            {role.description || role.role_name}
          </CardTitle>
          <Badge variant={badgeVariantForModule(dominantModule)}>
            {dominantModule ? moduleLabel(dominantModule) : "Chưa phân quyền"}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">{role.role_name}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Quyền hiện tại{!isLoading && !isError ? ` (${codes.length})` : ""}:
          </p>

          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner size="sm" />
              Đang tải quyền...
            </div>
          ) : isError ? (
            <p className="text-xs text-destructive">Không tải được quyền của vai trò.</p>
          ) : codes.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Vai trò này chưa được gán quyền nào.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {codes.map((code) => (
                <Badge
                  key={code}
                  variant="default"
                  className="text-xs flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  {code}
                </Badge>
              ))}
            </div>
          )}

          <PermissionGuard superAdminOnly>
            <div className="pt-3 border-t">
              <Button variant="ghost" size="sm" className="w-full" onClick={onEdit}>
                Chỉnh sửa quyền
              </Button>
            </div>
          </PermissionGuard>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const { isSuperAdmin, isLoadingPermissions, permissionsError, refetchPermissions } =
    usePermission();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ApiRole | null>(null);

  const {
    data: rolesData,
    isLoading,
    isError: isRolesError,
    error: rolesError,
    refetch: refetchRoles,
  } = useRolesList({ pageSize: 100 });

  const {
    data: catalog,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    error: catalogError,
    refetch: refetchCatalog,
  } = usePermissionsList();

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý vai trò</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Danh sách vai trò và phân quyền trong hệ thống
        </p>
      </div>
      <PermissionGuard superAdminOnly>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm vai trò
        </Button>
      </PermissionGuard>
    </div>
  );

  if (isLoadingPermissions || isLoading) {
    return <LoadingSection text="Đang tải danh sách vai trò..." />;
  }

  // Không xác định được quyền → nói đúng là LỖI TẢI và cho thử lại, không nói
  // "bạn không phải admin" (chưa biết thì chưa kết luận được).
  if (permissionsError) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorCard
          title="Không xác định được quyền của bạn"
          message={
            permissionsError.message ||
            "Không tải được quyền của tài khoản nên chưa thể mở trang phân quyền."
          }
          onRetry={() => void refetchPermissions()}
        />
      </div>
    );
  }

  // Các endpoint /permissions và /roles/{id}/permissions chỉ dành cho super
  // admin — người khác sẽ nhận 403, nên chặn sớm bằng thông báo rõ ràng thay vì
  // để trang hiện ra rồi vỡ từng thẻ.
  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorCard
          title="Chỉ quản trị viên cấp cao"
          message="Trang phân quyền vai trò chỉ dành cho tài khoản quản trị cấp cao (super admin). Vui lòng liên hệ quản trị viên nếu bạn cần thay đổi quyền của vai trò."
        />
      </div>
    );
  }

  const roles = rolesData?.rows ?? [];

  return (
    <div className="space-y-6">
      {header}

      {isRolesError ? (
        <ErrorCard
          title="Không tải được danh sách vai trò"
          message={rolesError?.message || "Đã xảy ra lỗi khi tải danh sách vai trò."}
          onRetry={() => void refetchRoles()}
        />
      ) : roles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-muted">
              <Users className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Chưa có vai trò</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Bắt đầu bằng cách tạo vai trò đầu tiên rồi gán quyền cho nó.
            </p>
            <PermissionGuard superAdminOnly>
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                <Plus data-icon="inline-start" className="size-4" />
                Thêm vai trò
              </Button>
            </PermissionGuard>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={() => setEditingRole(role)}
            />
          ))}
        </div>
      )}

      {/* Permissions Reference — nguồn: GET /permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Tham khảo - Danh sách quyền</CardTitle>
        </CardHeader>
        <CardContent>
          {isCatalogLoading ? (
            <LoadingSection text="Đang tải danh mục quyền..." />
          ) : isCatalogError ? (
            <div className="py-6 text-center">
              <p className="mb-4 text-sm text-destructive">
                {catalogError?.message || "Không thể tải danh mục quyền."}
              </p>
              <Button variant="outline" onClick={() => void refetchCatalog()}>
                <RefreshCw data-icon="inline-start" className="size-4" />
                Thử lại
              </Button>
            </div>
          ) : (catalog ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Danh mục quyền đang trống — backend chưa seed dữ liệu quyền.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupByModule(catalog ?? []).map(([module, permissions]) => (
                <div key={module} className="space-y-2">
                  <h3 className="font-medium text-gray-900">{moduleLabel(module)}</h3>
                  <ul className="space-y-1">
                    {permissions.map((perm) => (
                      <li
                        key={perm.code}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-gray-400" />
                        <span>
                          {perm.name}
                          {!isBackendEnforced(perm.code) && <NotEnforcedBadge />}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateRoleModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {editingRole && (
        <EditPermissionsModal
          role={editingRole}
          catalog={catalog ?? []}
          onClose={() => setEditingRole(null)}
        />
      )}
    </div>
  );
}

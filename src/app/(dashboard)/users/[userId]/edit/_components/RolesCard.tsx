import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { EditUserController } from "../hooks/useEditUserForm";

/** Card gán / gỡ vai trò cho người dùng (thay đổi được lưu khi bấm Lưu). */
export function RolesCard({ ctrl }: { ctrl: EditUserController }) {
  const { displayRoles, availableRoles, pendingRoleChanges, handleToggleRole, isRolePending } = ctrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vai tro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500">
          Chon vai tro de gan hoac go bo. Thay doi se duoc luu khi nhan &quot;Luu thay doi&quot;.
        </p>

        {/* Current roles + pending removes */}
        {displayRoles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayRoles.map((ur) => (
              <button
                key={ur.id}
                type="button"
                className="inline-flex items-center gap-2 py-2 px-3 cursor-pointer rounded-md border"
                onClick={() => handleToggleRole(ur.role_id, ur.role.description || ur.role.role_name, true)}
              >
                <Badge variant={isRolePending(ur.role_id) ? "warning" : "info"} className="pointer-events-none">
                  <span>{ur.role.description || ur.role.role_name}</span>
                  {isRolePending(ur.role_id) && <span className="ml-1">✕</span>}
                </Badge>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Chua co vai tro nao duoc gan.</p>
        )}

        {/* Available roles to add */}
        {availableRoles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                className="inline-flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-muted rounded-md border"
                onClick={() => handleToggleRole(role.id, role.description || role.role_name, false)}
              >
                <Badge variant="default" className="pointer-events-none">
                  <span>+ {role.description || role.role_name}</span>
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Pending changes indicator */}
        {pendingRoleChanges.length > 0 && (
          <p className="text-sm text-amber-600">
            Co {pendingRoleChanges.length} thay doi cho luu:{" "}
            {pendingRoleChanges.map((c) => (c.type === "add" ? `+ ${c.roleName}` : `- ${c.roleName}`)).join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

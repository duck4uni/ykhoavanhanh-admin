import Link from "next/link";
import { Eye, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { formatDate } from "@/lib/utils";
import { INTERNAL_ACCOUNTS_PAGE_SIZE, getInitials, getRoleTone } from "../helpers";
import type { InternalAccountsController } from "../hooks/useInternalAccounts";

/** Bảng tài khoản nội bộ + phân trang + trạng thái rỗng. */
export function AccountTable({ ctrl }: { ctrl: InternalAccountsController }) {
  const { filteredUsers, userRolesMap, currentPage, totalItems, totalPages, isFetching, isLoading, handlePageChange, handleDeleteClick, handleCreateAccount } = ctrl;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {isFetching && !isLoading && <div className="absolute right-4 top-4"><Spinner size="sm" /></div>}
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Chưa có tài khoản</h3>
          <p className="mb-4 text-sm text-muted-foreground">Bắt đầu bằng cách thêm tài khoản nhân viên đầu tiên.</p>
          <Button variant="primary" onClick={handleCreateAccount}>
            <Plus data-icon="inline-start" className="size-4" /> Thêm tài khoản
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">STT</th>
                  <th className="px-5 py-3.5">Nhân viên</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Điện thoại</th>
                  <th className="px-5 py-3.5">Vai trò</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Ngày tạo</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user, index) => {
                  const roles = userRolesMap.get(user.id) ?? [];
                  return (
                    <tr key={user.id} className="text-sm transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{(currentPage - 1) * INTERNAL_ACCOUNTS_PAGE_SIZE + index + 1}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar} name={getInitials(user.full_name)} size="sm" />
                          <span className="font-semibold text-slate-800">{user.full_name || "-"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{user.email || "-"}</td>
                      <td className="px-5 py-4 text-slate-600">{user.phone || "-"}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {roles.length ? roles.map((role) => <span key={role} className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRoleTone(role)}`}>{role}</span>) : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Chưa có vai trò</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${user.is_active ? "bg-success-light text-success" : "bg-warning-light text-warning"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{user.is_active ? "Hoạt động" : "Tạm khóa"}</span></td>
                      <td className="px-5 py-4 text-slate-600">{user.createdAt ? formatDate(user.createdAt) : "-"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/internal-accounts/${user.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-primary" title="Xem chi tiết"><Eye className="h-4 w-4" /></Link>
                          <Link href={`/internal-accounts/${user.id}/edit`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-primary" title="Chỉnh sửa"><Pencil className="h-4 w-4" /></Link>
                          <button onClick={() => handleDeleteClick(user.id, user.full_name ?? "Tài khoản")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50" title="Xóa"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-4">
            <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} totalItems={totalItems} pageSize={INTERNAL_ACCOUNTS_PAGE_SIZE} />
          </div>
        </>
      )}
    </div>
  );
}

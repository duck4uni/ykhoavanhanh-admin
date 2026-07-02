
"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { TablePagination } from "@/components/ui/TablePagination";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Spinner, LoadingSpinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { useUsersList, useDeleteUser } from "@/api/userApi";
import { useUserRolesList } from "@/api/userRolesApi";
import type { User } from "@/types/api-response";
import { formatDate } from "@/lib/utils";
import { Plus, RefreshCw, Trash2, Eye, Shield, Pencil } from "lucide-react";

const PAGE_SIZE = 10;

export default function InternalAccountsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const params = { currentPage, pageSize: PAGE_SIZE };

  const { data, isLoading, isFetching, error, refetch } = useUsersList(params);
  const { data: userRolesData } = useUserRolesList({ pageSize: 1000 });

  const deleteMutation = useDeleteUser({
    onSuccess: () => {
      toast.success("Xoa tai khoan thanh cong!");
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.message || "Xoa tai khoan that bai");
    },
  });

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteTarget({ id, name });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  }, [deleteTarget, deleteMutation]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleCreateAccount = useCallback(() => {
    window.location.href = "/internal-accounts/new";
  }, []);

  // Build user->roles map
  const userRolesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (userRolesData?.rows) {
      userRolesData.rows.forEach((ur) => {
        const existing = map.get(ur.user_id) || [];
        existing.push(ur.role.description || ur.role.role_name);
        map.set(ur.user_id, existing);
      });
    }
    return map;
  }, [userRolesData]);

  const apiUsers = data?.rows ?? [];
  const users: User[] = apiUsers.map((u) => ({
    id: u.id,
    full_name: u.full_name ?? undefined,
    phone: u.phone ?? undefined,
    email: u.email ?? undefined,
    avatar: u.avatar ?? undefined,
    is_active: u.is_active ?? false,
    is_admin: u.is_admin ?? false,
    createdAt: u.created_at ?? undefined,
    updatedAt: u.updated_at ?? undefined,
  }));
  const totalItems = data?.count ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Dang tai danh sach..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tai khoan noi bo</h1>
            <p className="text-sm text-muted-foreground mt-1">Quan ly tai khoan nhan Vien</p>
          </div>
        </div>
        <Card className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-destructive/10">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Da xay ra loi</h3>
            <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw data-icon="inline-start" className="size-4" />
              Thu lai
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tai khoan noi bo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quan ly tai khoan nhan Vien
              {totalItems > 0 && ` • ${totalItems} tai khoan`}
            </p>
          </div>
          <Button variant="primary" onClick={handleCreateAccount}>
            <Plus data-icon="inline-start" className="size-4" />
            Them tai khoan
          </Button>
        </div>

        <Card>
          {isFetching && !isLoading && (
            <div className="absolute top-4 right-4">
              <Spinner size="sm" />
            </div>
          )}

          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-muted">
                  <Shield className="size-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Chua co tai khoan</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Bat dau bang cach them tai khoan nhan Vien dau tien.
                </p>
                <Button variant="primary" onClick={handleCreateAccount}>
                  <Plus data-icon="inline-start" className="size-4" />
                  Them tai khoan
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhan Vien</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Dien thoai</TableHead>
                    <TableHead>Vai tro</TableHead>
                    <TableHead>Trang thai</TableHead>
                    <TableHead>Ngay tao</TableHead>
                    <TableHead className="w-[120px]">Thao tac</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.avatar}
                            name={user.full_name ?? "?"}
                            size="sm"
                          />
                          <span className="font-medium">{user.full_name || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userRolesMap.get(user.id)?.length ? (
                            userRolesMap.get(user.id)?.map((role) => (
                              <Badge key={role} variant="info">
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="default">Chua co vai tro</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "success" : "default"}>
                          {user.is_active ? "Hoat dong" : "Tam khoa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.createdAt ? formatDate(user.createdAt) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/internal-accounts/${user.id}`}>
                            <Button variant="ghost" size="icon-sm" title="Xem chi tiet">
                              <Eye data-icon="inline" className="size-4" />
                            </Button>
                          </Link>
                          <Link href={`/internal-accounts/${user.id}/edit`}>
                            <Button variant="ghost" size="icon-sm" title="Chinh sua">
                              <Pencil data-icon="inline" className="size-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Xoa"
                            onClick={() => handleDeleteClick(user.id, user.full_name ?? "Tai khoan")}
                          >
                            <Trash2 data-icon="inline" className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={totalItems}
                    pageSize={PAGE_SIZE}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Xac nhan xoa</CardTitle>
              <CardDescription>
                Ban co chan chan muon xoa tai khoan <strong>{deleteTarget.name}</strong>? Hanh dong nay khong the hoan tac.
              </CardDescription>
            </CardHeader>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <Button variant="outline" onClick={handleDeleteCancel} disabled={deleteMutation.isPending}>
                Huy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                isLoading={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Dang xoa..." : "Xoa"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
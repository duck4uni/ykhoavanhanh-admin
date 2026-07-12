import Link from "next/link";
import { Trash2, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { TablePagination } from "@/components/ui/TablePagination";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "./StateViews";
import { USERS_PAGE_SIZE, type UsersPageController } from "../hooks/useUsersPage";

/** Bảng người dùng admin + phân trang + trạng thái rỗng. */
export function UsersTable({ ctrl }: { ctrl: UsersPageController }) {
  const { users, currentPage, totalItems, totalPages, isFetching, isLoading, handlePageChange, handleDeleteClick, handleCreateUser } = ctrl;

  return (
    <Card>
      {isFetching && !isLoading && (
        <div className="absolute top-4 right-4">
          <Spinner size="sm" />
        </div>
      )}

      {users.length === 0 ? (
        <div className="p-6">
          <EmptyState onCreateUser={handleCreateUser} />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nguoi dung</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Quyen</TableHead>
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
                      <Avatar src={user.avatar} name={user.full_name ?? "?"} size="sm" />
                      <span className="font-medium">{user.full_name || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_admin ? "info" : "default"}>
                      {user.is_admin ? "Admin" : "Nguoi dung"}
                    </Badge>
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
                      <Link href={`/users/${user.id}`}>
                        <Button variant="ghost" size="icon-sm" title="Xem chi tiết">
                          <Eye data-icon="inline" className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Xóa"
                        onClick={() => handleDeleteClick(user.id, user.full_name ?? "Người dùng")}
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
                pageSize={USERS_PAGE_SIZE}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Props = {
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
};

export function DeleteConfirmation({ userName, onConfirm, onCancel, isDeleting }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Xác nhận xóa</CardTitle>
          <CardDescription>
            Bạn có chắc chắn muốn xóa người dùng <strong>{userName}</strong>? Hành động này không thể hoàn tác.
          </CardDescription>
        </CardHeader>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} isLoading={isDeleting}>
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/Button";

type Props = {
  name: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteAccountModal({ name, isDeleting, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-800">Xác nhận xóa</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn có chắc chắn muốn xóa tài khoản <strong>{name}</strong>? Hành động này không thể hoàn tác.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>Hủy</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} isLoading={isDeleting}>{isDeleting ? "Đang xóa..." : "Xóa"}</Button>
        </div>
      </div>
    </div>
  );
}

import { Plus, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-destructive/10">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Đã xảy ra lỗi</h3>
        <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw data-icon="inline-start" className="size-4" />
          Thử lại
        </Button>
      </div>
    </Card>
  );
}

export function EmptyState({ onCreateUser }: { onCreateUser: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-muted">
          <span className="text-2xl">👤</span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Chưa có người dùng</h3>
        <p className="mb-4 text-sm text-muted-foreground">Bắt đầu bằng cách thêm người dùng admin đầu tiên.</p>
        <Button variant="primary" onClick={onCreateUser}>
          <Plus data-icon="inline-start" className="size-4" />
          Thêm người dùng
        </Button>
      </div>
    </Card>
  );
}

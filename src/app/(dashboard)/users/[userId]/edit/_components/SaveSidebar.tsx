import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import type { EditUserController } from "../hooks/useEditUserForm";

/** Cột phải: bật/tắt kích hoạt, lưu/hủy, đặt lại mật khẩu. */
export function SaveSidebar({ ctrl }: { ctrl: EditUserController }) {
  const { form, setForm, isSaving, router, userId } = ctrl;

  return (
    <div className="space-y-4">
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle>Luu thay doi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Kich hoat tai khoan</span>
            <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
          <Button type="submit" variant="primary" className="w-full" disabled={isSaving}>
            {isSaving ? "Dang luu..." : "Luu thay doi"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => router.push(`/users/${userId}`)}>
            Huy
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dat lai mat khau</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">Gui email de nguoi dung tu dat lai mat khau.</p>
          <Button type="button" variant="outline" className="w-full">
            Gui email dat lai mat khau
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

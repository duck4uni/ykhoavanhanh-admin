import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { EditUserController } from "../hooks/useEditUserForm";

/** Card thông tin tài khoản (họ tên, CCCD, SĐT). */
export function AccountInfoCard({ ctrl }: { ctrl: EditUserController }) {
  const { form, setForm } = ctrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thong tin tai khoan</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label="Ho va ten *"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>
        <Input label="CCCD" value={form.cccd} onChange={(e) => setForm({ ...form, cccd: e.target.value })} />
        <Input label="So dien thoai" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </CardContent>
    </Card>
  );
}

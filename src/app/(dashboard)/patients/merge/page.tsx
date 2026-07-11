"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { useMergePatients } from "@/api/patientApi";
import { ArrowRight, Trash2 } from "lucide-react";

export default function MergePatientsPage() {
  const router = useRouter();
  const [keepCode, setKeepCode] = useState("");
  const [mergeCode, setMergeCode] = useState("");

  const mergeMutation = useMergePatients({
    onSuccess: () => {
      toast.success("Gộp bệnh nhân thành công!");
      setKeepCode("");
      setMergeCode("");
    },
    onError: (error) => {
      toast.error(error.message || "Gộp bệnh nhân thất bại");
    },
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!keepCode.trim() || !mergeCode.trim()) {
        toast.error("Vui lòng nhập mã bệnh nhân");
        return;
      }
      if (keepCode.trim() === mergeCode.trim()) {
        toast.error("Hai mã bệnh nhân phải khác nhau");
        return;
      }
      mergeMutation.mutate({
        payload: {
          patientid_keep: keepCode.trim(),
          patientid_merge: mergeCode.trim(),
        }
      });
    },
    [keepCode, mergeCode, mergeMutation]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gộp bệnh nhân</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gộp hai bản bệnh nhân trùng nhau thành một bản
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin gộp</CardTitle>
              <CardDescription>
                Nhập mã bệnh nhân cần gộp (sẽ bị xóa) và mã bệnh nhân được giữ lại.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Keep patient */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Bệnh nhân được giữ lại (chính)
                </label>
                <Input
                  value={keepCode}
                  onChange={(e) => setKeepCode(e.target.value)}
                  placeholder="VD: BN001"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Toàn bộ lịch sử khám chữa sẽ được giữ lại
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="flex items-center justify-center py-2">
                <ArrowRight className="size-8 text-gray-400" />
              </div>

              {/* Merge patient */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Benh nhan bi gop (trung)
                </label>
                <Input
                  value={mergeCode}
                  onChange={(e) => setMergeCode(e.target.value)}
                  placeholder="VD: BN002"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Se bi xoa sau khi gop
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Xac nhan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Luu y:</strong> Hanh dong gop khong the hoan tac. Toan bo du lieu cua benh nhan bi gop se duoc chuyen sang benh nhan chinh va bi xoa vinh vinh.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={mergeMutation.isPending || !keepCode.trim() || !mergeCode.trim()}
              >
                {mergeMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Dang gop...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4 mr-2" />
                    Gop benh nhan
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.back()}
              >
                Huy
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
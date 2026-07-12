"use client";

import { Button } from "@/components/ui/Button";
import { LoadingSection } from "@/components/ui/Spinner";
import { useEditUserForm } from "./hooks/useEditUserForm";
import { AccountInfoCard } from "./_components/AccountInfoCard";
import { RolesCard } from "./_components/RolesCard";
import { SaveSidebar } from "./_components/SaveSidebar";

export default function EditUserPage() {
  const ctrl = useEditUserForm();

  if (ctrl.isLoading) {
    return <LoadingSection text="Dang tai thong tin..." />;
  }

  if (!ctrl.apiUser) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Khong tim thay nguoi dung.</p>
        <Button variant="outline" className="mt-4" onClick={() => ctrl.router.back()}>
          Quay lai
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => ctrl.router.back()}>
          ← Quay lai
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chinh sua nguoi dung</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ctrl.form.cccd}</p>
        </div>
      </div>

      <form onSubmit={ctrl.handleSubmit} className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <AccountInfoCard ctrl={ctrl} />
          <RolesCard ctrl={ctrl} />
        </div>
        <SaveSidebar ctrl={ctrl} />
      </form>
    </div>
  );
}

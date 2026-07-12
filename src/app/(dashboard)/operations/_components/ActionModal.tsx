import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { OperationsController } from "../hooks/useOperations";

/** Modal nhập lý do hoàn / hủy phiếu. */
export function ActionModal({ ctrl }: { ctrl: OperationsController }) {
  const { modalType, closeModal, actionReason, setActionReason, submitTicketAction } = ctrl;

  return (
    <Modal
      isOpen={modalType !== null}
      onClose={closeModal}
      title={modalType === "refund" ? "Hoàn phiếu khám" : "Hủy phiếu khám"}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={closeModal}>Hủy</Button>
          <Button variant={modalType === "refund" ? "danger" : "primary"} onClick={submitTicketAction}>Xác nhận</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Ghi nhận lý do để hệ thống lưu lại lịch sử thao tác và phục vụ báo cáo cho kế toán.
        </p>
        <Input
          label="Lý do xử lý"
          value={actionReason}
          onChange={(event) => setActionReason(event.target.value)}
          placeholder="VD: Bác sĩ nghỉ đột xuất"
        />
      </div>
    </Modal>
  );
}

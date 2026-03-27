import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddStudentForm from "./AddStudentForm";

interface ManualAddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManualAddStudentDialog = ({ open, onOpenChange }: ManualAddStudentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>手動新增學員</DialogTitle>
        </DialogHeader>
        <AddStudentForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default ManualAddStudentDialog;

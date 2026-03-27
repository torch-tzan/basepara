import { Upload, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectManual: () => void;
  onSelectCsv: () => void;
}

const AddStudentDialog = ({ open, onOpenChange, onSelectManual, onSelectCsv }: AddStudentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>新增學員</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-6">
          <Button
            variant="outline"
            className="h-32 flex-col gap-3 hover:border-primary hover:bg-primary/5"
            onClick={() => {
              onOpenChange(false);
              onSelectCsv();
            }}
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
            <span className="text-base font-medium">上傳 CSV</span>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex-col gap-3 hover:border-primary hover:bg-primary/5"
            onClick={() => {
              onOpenChange(false);
              onSelectManual();
            }}
          >
            <UserPlus className="w-8 h-8 text-muted-foreground" />
            <span className="text-base font-medium">手動新增</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;

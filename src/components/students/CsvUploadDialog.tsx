import { useState } from "react";
import { CloudUpload, FileSpreadsheet, X, Download, Check, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CsvUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CsvUploadDialog = ({ open, onOpenChange }: CsvUploadDialogProps) => {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setUploadedFile({
        name: file.name,
        size: `${sizeInMB} MB`,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setUploadedFile({
        name: file.name,
        size: `${sizeInMB} MB`,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setUploadedFile(null);
  };

  const handleUpload = () => {
    if (!uploadedFile) {
      toast({
        title: "請先選擇檔案",
        variant: "destructive",
      });
      return;
    }

    // TODO: Process CSV file
    toast({
      title: "上傳成功",
      description: `已成功上傳：${uploadedFile.name}`,
    });
    
    setUploadedFile(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setUploadedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>上傳學員 CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone */}
          {!uploadedFile && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-border rounded-lg p-8 hover:border-muted-foreground cursor-pointer transition-colors"
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                    <CloudUpload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-foreground mb-1">
                      點擊上傳或拖曳檔案至此
                    </p>
                    <p className="text-xs text-muted-foreground">
                      支援 CSV、Excel 格式
                    </p>
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Uploaded File */}
          {uploadedFile && (
            <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-foreground">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {uploadedFile.size}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg border border-border">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground mb-1">
                學員資料上傳說明
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 支援格式：CSV、Excel (.xlsx, .xls)</li>
                <li>• 檔案大小限制：最大 10MB</li>
                <li>• 必填欄位：姓名、信箱</li>
                <li>• 選填欄位：身高、體重、生日、投打類型、所屬球隊、負責教練</li>
                <li>• 請確保資料格式符合系統範本規範</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            下載範本
          </Button>
          <Button className="flex items-center gap-2" onClick={handleUpload}>
            <Check className="w-4 h-4" />
            確認上傳
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CsvUploadDialog;

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import TrainingMediaUpload from "@/components/upload/TrainingMediaUpload";
import StructuredUpload from "@/components/upload/StructuredUpload";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Heart,
  CloudUpload,
  FileSpreadsheet,
  X,
  Download,
  Check,
  Info,
  Loader2,
  Mic,
  Video,
  FileUp,
  ClipboardList,
} from "lucide-react";

const uploadTypes = [
  { id: "batting-training", name: "打擊訓練數據", icon: LineChart, disabled: false },
  { id: "batting-data", name: "打擊數據", icon: LineChart, disabled: false },
  { id: "batting-checklist", name: "打擊機制檢核表", icon: FileSpreadsheet, disabled: false },
  { id: "pitching-training", name: "投球訓練數據", icon: LineChart, disabled: false },
  { id: "pitching-data", name: "投球數據", icon: LineChart, disabled: false },
  { id: "pitching-checklist", name: "投球機制檢核表", icon: FileSpreadsheet, disabled: false },
  { id: "fitness-mobility", name: "體能活動度數據", icon: Heart, disabled: false },
  { id: "training-audio", name: "訓練錄音檔", icon: Mic, disabled: false },
  { id: "training-video", name: "訓練影片", icon: Video, disabled: false },
];

type UploadMode = "scattered" | "structured";

const Upload = () => {
  const [mode, setMode] = useState<UploadMode>("scattered");
  const [selectedType, setSelectedType] = useState("batting-training");
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = () => {
    // Simulate file selection
    setUploadedFile({
      name: "檢測數據_2025-01-20.xlsx",
      size: "2.4 MB",
    });
  };

  const clearFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
  };

  const handleUpload = useCallback(() => {
    if (!uploadedFile || isUploading) return;
    
    setIsUploading(true);
    setUploadProgress(0);
  }, [uploadedFile, isUploading]);

  // Simulate upload progress
  useEffect(() => {
    if (!isUploading) return;

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast({
            variant: "success",
            title: "✓ 上傳成功",
            description: `檔案「${uploadedFile?.name}」已成功上傳`,
          });
          setUploadedFile(null);
          return 0;
        }
        // Simulate realistic upload progress
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 100);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isUploading, uploadedFile, toast]);

  return (
    <AppLayout title="資料上傳">
      <div className="space-y-6">
        {/* ═══ 模式切換：單檔上傳 / 當日整批上傳 ═══ */}
        <section className="bg-card rounded-lg border border-border p-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("scattered")}
              className={cn(
                "flex items-start gap-3 p-4 rounded-md text-left transition-all",
                mode === "scattered"
                  ? "bg-primary/10 border border-primary/40"
                  : "border border-transparent hover:bg-accent/40"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  mode === "scattered" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                <FileUp className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium", mode === "scattered" ? "text-foreground" : "text-muted-foreground")}>
                  零散數據上傳
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  依檔案類型散著上傳，每次一個類型
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("structured")}
              className={cn(
                "flex items-start gap-3 p-4 rounded-md text-left transition-all",
                mode === "structured"
                  ? "bg-primary/10 border border-primary/40"
                  : "border border-transparent hover:bg-accent/40"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  mode === "structured" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium", mode === "structured" ? "text-foreground" : "text-muted-foreground")}>
                  檢測 / 分析數據上傳
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  依「投/打 × 檢測/訓練」一次補齊當日所需的所有檔案
                </div>
              </div>
            </button>
          </div>
        </section>

        {mode === "structured" ? (
          <StructuredUpload />
        ) : (
          <>
        {/* Upload Type Selection */}
        <section className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">選擇上傳類型</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              const isDisabled = type.disabled;
              return (
                <button
                  key={type.id}
                  onClick={() => !isDisabled && setSelectedType(type.id)}
                  disabled={isDisabled}
                  className={`group flex flex-col items-center gap-3 p-4 rounded-lg border transition-all duration-300 ${
                    isDisabled
                      ? "border-border bg-muted/30 cursor-not-allowed opacity-50"
                      : isSelected
                        ? "border-primary bg-accent dark:bg-white/10"
                        : "border-border hover:bg-accent/50 hover:shadow-lg"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isDisabled
                        ? "bg-muted"
                        : isSelected
                          ? "bg-primary/10 dark:bg-primary/20 group-hover:scale-110"
                          : "bg-accent dark:bg-white/10 group-hover:scale-110"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isDisabled
                          ? "text-muted-foreground/50"
                          : isSelected
                            ? "text-primary"
                            : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-sm ${
                      isDisabled
                        ? "text-muted-foreground/50"
                        : isSelected
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {type.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* File Upload Section */}
        <section className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">上傳檔案</h3>
          
          {/* Training Audio/Video Upload - Custom Component */}
          {selectedType === "training-audio" ? (
            <TrainingMediaUpload type="audio" />
          ) : selectedType === "training-video" ? (
            <TrainingMediaUpload type="video" />
          ) : (
            <div className="space-y-4">
              {/* Drop Zone */}
              {!uploadedFile && (
                <div
                  onClick={handleFileSelect}
                  className="border border-dashed border-border rounded-lg p-8 hover:border-muted-foreground cursor-pointer transition-colors"
                >
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
                </div>
              )}

              {/* Uploaded File */}
              {uploadedFile && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-accent/50 dark:bg-white/5 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent dark:bg-white/10 rounded flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {uploadedFile.size}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={clearFile}
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>上傳中...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress 
                        value={uploadProgress} 
                        className="h-2 bg-secondary dark:bg-white/10"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 bg-accent/50 dark:bg-white/5 rounded-lg border border-border">
                <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground mb-1">
                    檢測數據上傳說明
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 支援格式：CSV、Excel (.xlsx, .xls)</li>
                    <li>• 檔案大小限制：最大 10MB</li>
                    <li>• 請確保資料格式符合系統範本規範</li>
                    <li>• 可在「範本管理」頁面下載標準格式範本</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className={`flex items-center ${selectedType === "training-audio" || selectedType === "training-video" ? "justify-end" : "justify-between"}`}>
          {selectedType !== "training-audio" && selectedType !== "training-video" && (
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              下載範本
            </Button>
          )}
          <Button 
            className="flex items-center gap-2" 
            onClick={handleUpload}
            disabled={!uploadedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                上傳中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                確認上傳
              </>
            )}
          </Button>
        </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Upload;

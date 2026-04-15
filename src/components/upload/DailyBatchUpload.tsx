import { useState, useRef } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  CalendarIcon,
  CloudUpload,
  X,
  Check,
  Loader2,
  LineChart,
  Heart,
  FileSpreadsheet,
  Mic,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStudents } from "@/contexts/StudentsContext";
import { cn } from "@/lib/utils";

/**
 * 當日批次上傳 — 教練可一次針對「某位學員 + 某個日期」上傳多個欄位的檔案
 * 例如：同一天的打擊數據、機制檢核、訓練錄音、訓練影片一次提交。
 */

interface BatchField {
  key: string;
  name: string;
  icon: LucideIcon;
  /** 檔案格式 */
  accept: string;
  /** 描述 */
  hint: string;
}

const BATCH_FIELDS: BatchField[] = [
  { key: "batting-data", name: "打擊數據", icon: LineChart, accept: ".csv,.xlsx,.xls", hint: "CSV / Excel" },
  { key: "batting-checklist", name: "打擊機制檢核表", icon: FileSpreadsheet, accept: ".csv,.xlsx,.xls,.pdf", hint: "CSV / Excel / PDF" },
  { key: "pitching-data", name: "投球數據", icon: LineChart, accept: ".csv,.xlsx,.xls", hint: "CSV / Excel" },
  { key: "pitching-checklist", name: "投球機制檢核表", icon: FileSpreadsheet, accept: ".csv,.xlsx,.xls,.pdf", hint: "CSV / Excel / PDF" },
  { key: "fitness-mobility", name: "體能活動度數據", icon: Heart, accept: ".csv,.xlsx,.xls", hint: "CSV / Excel" },
  { key: "training-audio", name: "訓練錄音檔", icon: Mic, accept: "audio/*", hint: "MP3 / WAV / M4A" },
  { key: "training-video", name: "訓練影片", icon: Video, accept: "video/*", hint: "MP4 / MOV（可多選）" },
];

/** 每個欄位對應的檔案（訓練影片允許多檔，其餘單檔） */
type FieldFilesMap = Record<string, File[]>;

const DailyBatchUpload = () => {
  const { students } = useStudents();
  const { toast } = useToast();

  const [studentId, setStudentId] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [fieldFiles, setFieldFiles] = useState<FieldFilesMap>({});
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.name} - ${s.teamName}`,
  }));

  const handlePickFile = (fieldKey: string) => {
    inputRefs.current[fieldKey]?.click();
  };

  const handleFileChange = (fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const isMulti = fieldKey === "training-video";
    const arr = Array.from(files);
    setFieldFiles((prev) => ({
      ...prev,
      [fieldKey]: isMulti ? [...(prev[fieldKey] || []), ...arr] : [arr[0]],
    }));
    if (inputRefs.current[fieldKey]) {
      inputRefs.current[fieldKey]!.value = "";
    }
  };

  const removeFile = (fieldKey: string, idx: number) => {
    setFieldFiles((prev) => {
      const next = { ...prev };
      const list = [...(next[fieldKey] || [])];
      list.splice(idx, 1);
      if (list.length === 0) delete next[fieldKey];
      else next[fieldKey] = list;
      return next;
    });
  };

  const totalFiles = Object.values(fieldFiles).reduce((sum, list) => sum + list.length, 0);
  /** 缺少檔案的欄位清單（所有欄位皆為必填） */
  const missingFields = BATCH_FIELDS.filter((f) => !(fieldFiles[f.key]?.length));
  const allFieldsFilled = missingFields.length === 0;
  const canSubmit = !!studentId && !!date && allFieldsFilled && !isUploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsUploading(true);
    setProgress(0);

    // 模擬上傳進度
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setIsUploading(false);
          toast({
            variant: "success",
            title: "✓ 當日批次上傳完成",
            description: `已上傳 ${totalFiles} 個檔案（${format(date, "yyyy/MM/dd")}）`,
          });
          setFieldFiles({});
          return 0;
        }
        return Math.min(p + Math.random() * 12 + 5, 100);
      });
    }, 250);
  };

  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* 學員 + 日期 */}
      <section className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">選擇學員與日期</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">學員 <span className="text-destructive">*</span></label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="選擇學員" />
              </SelectTrigger>
              <SelectContent>
                {studentOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">訓練日期 <span className="text-destructive">*</span></label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "yyyy/MM/dd", { locale: zhTW }) : "選擇日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>

      {/* 分欄位上傳 */}
      <section className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-foreground">分欄位上傳</h3>
            <p className="text-xs text-muted-foreground mt-1">
              一次提交當日所有訓練相關資料；每個欄位一個檔案（訓練影片可多檔）
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalFiles > 0 && (
              <span className="text-sm font-medium text-primary">共 {totalFiles} 個檔案</span>
            )}
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-md",
                allFieldsFilled
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
              )}
            >
              {allFieldsFilled
                ? `全部欄位已備齊（${BATCH_FIELDS.length}/${BATCH_FIELDS.length}）`
                : `已備齊 ${BATCH_FIELDS.length - missingFields.length}/${BATCH_FIELDS.length}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BATCH_FIELDS.map((field) => {
            const Icon = field.icon;
            const files = fieldFiles[field.key] || [];
            const hasFile = files.length > 0;

            return (
              <div
                key={field.key}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  hasFile ? "border-primary/50 bg-primary/[0.03]" : "border-border hover:border-muted-foreground/50"
                )}
              >
                <input
                  ref={(el) => (inputRefs.current[field.key] = el)}
                  type="file"
                  accept={field.accept}
                  multiple={field.key === "training-video"}
                  className="hidden"
                  onChange={(e) => handleFileChange(field.key, e)}
                />

                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      hasFile ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium">{field.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handlePickFile(field.key)}
                      >
                        <CloudUpload className="w-3.5 h-3.5 mr-1" />
                        {hasFile ? (field.key === "training-video" ? "加選" : "更換") : "選擇檔案"}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{field.hint}</p>

                    {hasFile && (
                      <div className="mt-2 space-y-1">
                        {files.map((f, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs bg-background/80 rounded px-2 py-1 border border-border/50"
                          >
                            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span className="flex-1 min-w-0 truncate">{f.name}</span>
                            <span className="text-muted-foreground flex-shrink-0">{formatSize(f.size)}</span>
                            <button
                              className="text-muted-foreground hover:text-destructive flex-shrink-0"
                              onClick={() => removeFile(field.key, idx)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 上傳進度 */}
      {isUploading && (
        <section className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>批次上傳中...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-secondary dark:bg-white/10" />
        </section>
      )}

      {/* 送出 */}
      <div className="flex items-center justify-end gap-3">
        {!allFieldsFilled && (
          <span className="text-xs text-muted-foreground">
            尚缺：{missingFields.map((f) => f.name).join("、")}
          </span>
        )}
        <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              上傳中...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              一次送出當日所有資料（{totalFiles}）
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DailyBatchUpload;

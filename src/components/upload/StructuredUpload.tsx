/**
 * 結構化上傳：檢測 / 訓練 數據上傳
 *  - 選擇方向：投球 / 打擊
 *  - 選擇類型：檢測 / 訓練
 *  - 依「方向 × 類型」呈現必填 / 可選的檔案欄位（slot 化）
 *
 * 規格：
 *   檢測 — 必上傳：投手(打擊)數據表、慢動作攝影、錄音分析檔、投球(打擊)機制檢核
 *   訓練 — 必上傳：訓練影片、分析錄音
 *          可選：訓練數據、投手(打擊)數據表
 */

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  CloudUpload,
  FileSpreadsheet,
  Video,
  Mic,
  ClipboardCheck,
  X,
  Loader2,
  Check,
  Info,
} from "lucide-react";

type Direction = "batting" | "pitching";
type Mode = "assessment" | "training";

interface SlotDef {
  key: string;
  name: string;
  icon: typeof Video;
  required: boolean;
  hint?: string;
}

/** 依「方向 × 類型」回傳必填 / 可選欄位 */
function getSlots(dir: Direction, mode: Mode): SlotDef[] {
  const dataSheet = dir === "pitching" ? "投手數據表" : "打擊數據表";
  const checklist = dir === "pitching" ? "投球機制檢核" : "打擊機制檢核";
  if (mode === "assessment") {
    return [
      { key: "data-sheet", name: dataSheet, icon: FileSpreadsheet, required: true, hint: "CSV / Excel" },
      { key: "slow-mo", name: "慢動作攝影", icon: Video, required: true, hint: "MP4 / MOV" },
      { key: "audio", name: "錄音分析檔", icon: Mic, required: true, hint: "MP3 / WAV / M4A" },
      { key: "checklist", name: checklist, icon: ClipboardCheck, required: true, hint: "Excel / PDF" },
    ];
  }
  // training
  return [
    { key: "training-video", name: "訓練影片", icon: Video, required: true, hint: "MP4 / MOV" },
    { key: "audio", name: "分析錄音", icon: Mic, required: true, hint: "MP3 / WAV / M4A" },
    { key: "training-data", name: "訓練數據", icon: FileSpreadsheet, required: false, hint: "CSV / Excel（可選）" },
    { key: "data-sheet", name: dataSheet, icon: FileSpreadsheet, required: false, hint: "CSV / Excel（可選）" },
  ];
}

interface FileSlot {
  name: string;
  size: string;
}

const StructuredUpload = () => {
  const { toast } = useToast();
  const [direction, setDirection] = useState<Direction>("batting");
  const [mode, setMode] = useState<Mode>("assessment");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [files, setFiles] = useState<Record<string, FileSlot | undefined>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const slots = useMemo(() => getSlots(direction, mode), [direction, mode]);

  // 切換方向 / 類型時，清空已選檔案
  useEffect(() => { setFiles({}); }, [direction, mode]);

  const pickFile = (key: string) => {
    // mock 檔案選擇
    setFiles((prev) => ({
      ...prev,
      [key]: { name: `${key}_${date}.dat`, size: `${(Math.random() * 5 + 1).toFixed(1)} MB` },
    }));
  };

  const clearFile = (key: string) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const requiredKeys = slots.filter((s) => s.required).map((s) => s.key);
  const allRequiredFilled = requiredKeys.every((k) => files[k]);

  const handleSubmit = () => {
    if (!allRequiredFilled || isUploading) return;
    setIsUploading(true);
    setProgress(0);
  };

  // 模擬上傳進度
  useEffect(() => {
    if (!isUploading) return;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setIsUploading(false);
          toast({
            variant: "success",
            title: "✓ 上傳成功",
            description: `${direction === "pitching" ? "投球" : "打擊"} · ${mode === "assessment" ? "檢測" : "訓練"} 資料已上傳`,
          });
          setFiles({});
          return 0;
        }
        return Math.min(p + Math.random() * 12 + 4, 100);
      });
    }, 200);
    return () => clearInterval(id);
  }, [isUploading, toast, direction, mode]);

  return (
    <div className="space-y-6">
      {/* 方向 + 類型 + 日期 */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-5">
        <h3 className="text-lg font-medium text-foreground">選擇上傳目標</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 方向：投/打 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">方向</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "batting", label: "打擊" },
                { value: "pitching", label: "投球" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDirection(opt.value)}
                  className={cn(
                    "h-10 rounded-md border text-sm transition-all",
                    direction === opt.value
                      ? "bg-primary/10 border-primary text-foreground"
                      : "border-border text-muted-foreground hover:bg-accent/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 類型：檢測/訓練 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">類型</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "assessment", label: "檢測" },
                { value: "training", label: "訓練" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
                  className={cn(
                    "h-10 rounded-md border text-sm transition-all",
                    mode === opt.value
                      ? "bg-primary/10 border-primary text-foreground"
                      : "border-border text-muted-foreground hover:bg-accent/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 日期 */}
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="upload-date" className="text-xs text-muted-foreground">資料日期</Label>
          <Input
            id="upload-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10"
          />
        </div>
      </section>

      {/* 檔案 slot 區 */}
      <section className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">
            {direction === "pitching" ? "投球" : "打擊"} · {mode === "assessment" ? "檢測" : "訓練"} 必要資料
          </h3>
          <span className="text-xs text-muted-foreground">
            必填 {requiredKeys.filter((k) => files[k]).length} / {requiredKeys.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {slots.map((slot) => {
            const Icon = slot.icon;
            const f = files[slot.key];
            return (
              <div
                key={slot.key}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  f ? "border-primary/40 bg-accent/40" : "border-dashed border-border hover:border-muted-foreground"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        {slot.name}
                        {slot.required ? (
                          <span className="text-[10px] text-red-500 font-semibold">必填</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">可選</span>
                        )}
                      </div>
                      {slot.hint && <div className="text-[11px] text-muted-foreground mt-0.5">{slot.hint}</div>}
                    </div>
                  </div>
                  {f && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => clearFile(slot.key)} disabled={isUploading}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {f ? (
                  <div className="text-xs text-muted-foreground truncate">{f.name} · {f.size}</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => pickFile(slot.key)}
                    className="w-full h-16 rounded-md border border-dashed border-border/60 hover:border-muted-foreground transition-colors flex items-center justify-center gap-2 text-xs text-muted-foreground"
                  >
                    <CloudUpload className="w-4 h-4" />
                    點擊上傳或拖曳檔案
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 進度條 */}
        {isUploading && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>上傳中...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-secondary dark:bg-white/10" />
          </div>
        )}

        {/* 說明 */}
        <div className="flex items-start gap-3 p-4 bg-accent/40 dark:bg-white/5 rounded-lg border border-border">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 必填欄位需全部上傳才能送出</p>
            <p>• 系統將以「資料日期 + 方向 + 類型」做歸檔，相同條件之資料會被覆蓋</p>
            <p>• 可在「範本管理」頁面下載各檔案標準範本</p>
          </div>
        </div>
      </section>

      {/* 送出 */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!allRequiredFilled || isUploading} className="flex items-center gap-2">
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              上傳中...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              送出本日{mode === "assessment" ? "檢測" : "訓練"}資料
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StructuredUpload;

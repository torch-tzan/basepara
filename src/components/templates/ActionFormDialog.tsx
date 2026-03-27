import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  type ActionItem,
  type ActionCategory,
  actionCategoryOptions,
  batOptions,
  equipmentOptions,
  setsOptions,
  repsOptions,
} from "@/data/trainingTemplates";
import { useTrainingData } from "@/contexts/TrainingDataContext";

interface ActionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: ActionItem | null; // null = 新增模式
  onSave: (action: Omit<ActionItem, "id" | "updatedAt" | "type">) => void;
}

const ActionFormDialog = ({
  open,
  onOpenChange,
  action,
  onSave,
}: ActionFormDialogProps) => {
  const isEditMode = !!action;
  const { actionCategories } = useTrainingData();
  
  // 動作分類選項（從 Context 取得已排序的分類）
  const actionListCategoryOptions = actionCategories.map((cat) => ({
    value: cat.name,
    label: cat.name,
  }));

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [actionCategory, setActionCategory] = useState<ActionCategory>("非投打");
  const [bat, setBat] = useState("");
  const [equipment, setEquipment] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [intensity, setIntensity] = useState(70);
  const [notes, setNotes] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or action changes
  useEffect(() => {
    if (open && action) {
      setName(action.name);
      setCategory(action.category);
      setActionCategory(action.actionCategory);
      setBat(action.bat || "");
      setEquipment(action.equipment || "");
      setSets(String(action.sets));
      setReps(String(action.reps));
      setIntensity(action.intensity);
      setNotes(action.notes || "");
      setVideoUrl(action.videoUrl || "");
    } else if (open && !action) {
      // Reset for new action
      setName("");
      setCategory("");
      setActionCategory("非投打");
      setBat("");
      setEquipment("");
      setSets("3");
      setReps("10");
      setIntensity(70);
      setNotes("");
      setVideoUrl("");
    }
    setErrors({});
  }, [open, action]);

  // Clear bat when action category changes away from 打擊
  useEffect(() => {
    if (actionCategory !== "打擊") {
      setBat("");
    }
  }, [actionCategory]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "請輸入動作名稱";
    }
    if (!category.trim()) {
      newErrors.category = "請輸入分類";
    }
    if (!actionCategory) {
      newErrors.actionCategory = "請選擇動作分類";
    }
    if (actionCategory === "打擊" && !bat) {
      newErrors.bat = "請選擇球棒";
    }
    if (videoUrl && !isValidUrl(videoUrl)) {
      newErrors.videoUrl = "請輸入有效的網址";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onSave({
      name: name.trim(),
      category: category.trim(),
      actionCategory,
      bat: actionCategory === "打擊" ? bat : undefined,
      equipment: equipment || undefined,
      sets: Number(sets),
      reps: Number(reps),
      intensity,
      notes: notes.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
    });

    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "編輯動作" : "新增動作"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 動作名稱 */}
          <FormField
            label="動作名稱"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="輸入動作名稱"
            error={errors.name}
          />

          {/* 分類（列表顯示用） */}
          <FormSelect
            label="分類"
            required
            value={category}
            onValueChange={setCategory}
            placeholder="選擇分類"
            options={actionListCategoryOptions}
            error={errors.category}
          />

          {/* 動作分類 */}
          <FormSelect
            label="動作分類"
            required
            value={actionCategory}
            onValueChange={(val) => setActionCategory(val as ActionCategory)}
            placeholder="選擇動作分類"
            options={actionCategoryOptions}
            error={errors.actionCategory}
            description="決定動作類型，影響可選欄位"
          />

          {/* 球棒（僅打擊時顯示） */}
          {actionCategory === "打擊" && (
            <FormSelect
              label="球棒"
              required
              value={bat}
              onValueChange={setBat}
              placeholder="選擇球棒"
              options={batOptions}
              error={errors.bat}
            />
          )}

          {/* 輔具 */}
          <FormSelect
            label="輔具"
            value={equipment}
            onValueChange={setEquipment}
            placeholder="選擇輔具（可選）"
            options={equipmentOptions}
          />

          {/* 組數與次數 */}
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="組數"
              required
              value={sets}
              onValueChange={setSets}
              placeholder="選擇組數"
              options={setsOptions}
            />
            <FormSelect
              label="次數"
              required
              value={reps}
              onValueChange={setReps}
              placeholder="選擇次數"
              options={repsOptions}
            />
          </div>

          {/* 強度 */}
          <div className="space-y-2">
            <Label>
              強度 <span className="text-primary font-medium">{intensity}%</span>
            </Label>
            <Slider
              value={[intensity]}
              onValueChange={(val) => setIntensity(val[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              拖拉調整訓練強度 (0-100%)
            </p>
          </div>

          {/* 備注 */}
          <FormTextarea
            label="備注"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="輸入備注說明（可選）"
            rows={3}
          />

          {/* 影片連結 */}
          <FormField
            label="影片連結"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="輸入影片網址（可選）"
            error={errors.videoUrl}
            description="可貼上 YouTube 或其他影片平台連結"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            {isEditMode ? "儲存變更" : "新增動作"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActionFormDialog;

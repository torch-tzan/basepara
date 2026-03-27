import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { PageSection, PageSectionTitle } from "@/components/ui/page-section";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  type ActionCategory,
  actionCategoryOptions,
  batOptions,
  scenarioOptions,
  ballOptions,
} from "@/data/trainingTemplates";
import { useTrainingData } from "@/contexts/TrainingDataContext";
import { Input } from "@/components/ui/input";


const ActionForm = () => {
  const navigate = useNavigate();
  const { actionId } = useParams<{ actionId: string }>();
  const [searchParams] = useSearchParams();
  const copyFromId = searchParams.get("copyFrom");
  const { toast } = useToast();
  const { actionCategories, getActionById, addAction, updateAction } = useTrainingData();
  
  // 動作分類選項（從 Context 取得已排序的分類）
  const actionListCategoryOptions = actionCategories.map((cat) => ({
    value: cat.name,
    label: cat.name,
  }));
  
  const isEditMode = !!actionId;
  const isCopyMode = !!copyFromId;

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [actionCategory, setActionCategory] = useState<ActionCategory>("非投打");
  const [bat, setBat] = useState("");
  const [scenario, setScenario] = useState("");
  const [ball, setBall] = useState("");
  const [equipment, setEquipment] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [intensity, setIntensity] = useState(70);
  const [notes, setNotes] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 離開確認對話框狀態
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  
  // 追蹤初始值以判斷是否有變更
  const initialValues = useRef<{
    name: string;
    category: string;
    actionCategory: ActionCategory;
    bat: string;
    scenario: string;
    ball: string;
    equipment: string;
    sets: string;
    reps: string;
    intensity: number;
    notes: string;
    videoUrl: string;
  } | null>(null);

  // Load action data if editing or copying
  useEffect(() => {
    const targetId = actionId || copyFromId;
    if (targetId) {
      const action = getActionById(targetId);
      if (action) {
        // 如果是複製模式，加上「(複製)」後綴
        const actionName = isCopyMode ? `${action.name} (複製)` : action.name;
        setName(actionName);
        setCategory(action.category);
        setActionCategory(action.actionCategory);
        setBat(action.bat || "");
        setScenario(action.scenario || "");
        setBall(action.ball || "");
        setEquipment(action.equipment || "");
        setSets(String(action.sets));
        setReps(String(action.reps));
        setIntensity(action.intensity);
        setNotes(action.notes || "");
        setVideoUrl(action.videoUrl || "");
        
        // 設定初始值（用於判斷是否有變更）
        initialValues.current = {
          name: actionName,
          category: action.category,
          actionCategory: action.actionCategory,
          bat: action.bat || "",
          scenario: action.scenario || "",
          ball: action.ball || "",
          equipment: action.equipment || "",
          sets: String(action.sets),
          reps: String(action.reps),
          intensity: action.intensity,
          notes: action.notes || "",
          videoUrl: action.videoUrl || "",
        };
      }
    } else {
      // 新增模式的初始值
      initialValues.current = {
        name: "",
        category: "",
        actionCategory: "非投打",
        bat: "",
        scenario: "",
        ball: "",
        equipment: "",
        sets: "3",
        reps: "10",
        intensity: 70,
        notes: "",
        videoUrl: "",
      };
    }
  }, [actionId, copyFromId, isCopyMode, getActionById]);

  // Clear bat/scenario when action category changes away from 打擊
  useEffect(() => {
    if (actionCategory !== "打擊") {
      setBat("");
      setScenario("");
    }
  }, [actionCategory]);

  // Clear ball when action category changes away from 投球
  useEffect(() => {
    if (actionCategory !== "投球") {
      setBall("");
    }
  }, [actionCategory]);

  // 判斷表單是否有變更
  const hasChanges = useCallback(() => {
    if (!initialValues.current) return false;
    
    return (
      name !== initialValues.current.name ||
      category !== initialValues.current.category ||
      actionCategory !== initialValues.current.actionCategory ||
      bat !== initialValues.current.bat ||
      scenario !== initialValues.current.scenario ||
      ball !== initialValues.current.ball ||
      equipment !== initialValues.current.equipment ||
      sets !== initialValues.current.sets ||
      reps !== initialValues.current.reps ||
      intensity !== initialValues.current.intensity ||
      notes !== initialValues.current.notes ||
      videoUrl !== initialValues.current.videoUrl
    );
  }, [name, category, actionCategory, bat, scenario, ball, equipment, sets, reps, intensity, notes, videoUrl]);

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "請輸入動作名稱";
    }
    if (!category) {
      newErrors.category = "請選擇分類";
    }
    if (!actionCategory) {
      newErrors.actionCategory = "請選擇動作分類";
    }
    if (actionCategory === "打擊" && !bat) {
      newErrors.bat = "請選擇球棒";
    }
    if (actionCategory === "打擊" && !scenario) {
      newErrors.scenario = "請選擇情境";
    }
    if (actionCategory === "投球" && !ball) {
      newErrors.ball = "請選擇球";
    }
    
    // 驗證組數
    const setsNum = Number(sets);
    if (!sets || isNaN(setsNum) || setsNum < 1 || setsNum > 99) {
      newErrors.sets = "請輸入 1-99 之間的數字";
    }
    
    // 驗證次數
    const repsNum = Number(reps);
    if (!reps || isNaN(repsNum) || repsNum < 1 || repsNum > 99) {
      newErrors.reps = "請輸入 1-99 之間的數字";
    }
    
    if (videoUrl && !isValidUrl(videoUrl)) {
      newErrors.videoUrl = "請輸入有效的網址";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const actionData = {
        name: name.trim(),
        category,
        actionCategory,
        bat: actionCategory === "打擊" ? bat : undefined,
        scenario: actionCategory === "打擊" ? scenario : undefined,
        ball: actionCategory === "投球" ? ball : undefined,
        equipment: equipment || undefined,
        sets: Number(sets),
        reps: Number(reps),
        intensity,
        notes: notes.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
      };

      if (isEditMode && actionId) {
        // 更新現有動作
        await updateAction(actionId, actionData);
        toast({
          title: "動作已更新",
          description: `「${name}」已成功更新`,
        });
      } else {
        // 新增動作
        await addAction(actionData);
        toast({
          title: "動作已新增",
          description: `「${name}」已成功新增`,
        });
      }

      // 返回儲存的 URL 或預設路徑
      const returnUrl = sessionStorage.getItem("templatesReturnUrl");
      if (returnUrl) {
        sessionStorage.removeItem("templatesReturnUrl");
        const url = new URL(returnUrl);
        navigate(url.pathname + url.search);
      } else {
        navigate("/templates?type=action");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "操作失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowLeaveDialog(true);
    } else {
      const returnUrl = sessionStorage.getItem("templatesReturnUrl");
      if (returnUrl) {
        sessionStorage.removeItem("templatesReturnUrl");
        const url = new URL(returnUrl);
        navigate(url.pathname + url.search);
      } else {
        navigate("/templates?type=action");
      }
    }
  };

  const handleConfirmLeave = () => {
    setShowLeaveDialog(false);
    const returnUrl = sessionStorage.getItem("templatesReturnUrl");
    if (returnUrl) {
      sessionStorage.removeItem("templatesReturnUrl");
      const url = new URL(returnUrl);
      navigate(url.pathname + url.search);
    } else {
      navigate("/templates?type=action");
    }
  };

  return (
    <AppLayout
      title={isEditMode ? "編輯動作" : isCopyMode ? "複製動作" : "新增動作"}
      headerAction={
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "儲存中..." : "新增中..."}
              </>
            ) : (
              isEditMode ? "儲存變更" : "新增動作"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Breadcrumb */}
        <PageBreadcrumb
          items={[
            { label: "公用範本", path: "/templates?type=action" },
            { label: isEditMode ? name || "動作" : isCopyMode ? "複製動作" : "新增動作" },
          ]}
        />

        {/* 基本資訊 */}
        <PageSection className="p-6">
          <PageSectionTitle unwrapped className="mb-4">基本資訊</PageSectionTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              {/* 投球時顯示球選單 */}
              {actionCategory === "投球" && (
                <FormSelect
                  label="球"
                  required
                  value={ball}
                  onValueChange={setBall}
                  placeholder="選擇球"
                  options={ballOptions}
                  error={errors.ball}
                />
              )}
              
              {/* 輔具（非打擊時顯示在第二欄） */}
              {actionCategory !== "打擊" && (
                <FormField
                  label="輔具"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="輸入輔具（可選）"
                />
              )}
            </div>
            
            {/* 打擊時顯示情境與輔具 */}
            {actionCategory === "打擊" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                  label="情境"
                  required
                  value={scenario}
                  onValueChange={setScenario}
                  placeholder="選擇情境"
                  options={scenarioOptions}
                  error={errors.scenario}
                />
                <FormField
                  label="輔具"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="輸入輔具（可選）"
                />
              </div>
            )}
          </div>
        </PageSection>

        {/* 訓練參數 */}
        <PageSection className="p-6">
          <PageSectionTitle unwrapped className="mb-4">訓練參數</PageSectionTitle>
          <div className="space-y-6">
            {/* 組數與次數 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>組數 <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={sets}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (Number(val) >= 1 && Number(val) <= 99)) {
                      setSets(val);
                    }
                  }}
                  placeholder="1-99"
                  className={errors.sets ? "border-destructive" : ""}
                />
                {errors.sets && (
                  <p className="text-sm text-destructive">{errors.sets}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>次數 <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={reps}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (Number(val) >= 1 && Number(val) <= 99)) {
                      setReps(val);
                    }
                  }}
                  placeholder="1-99"
                  className={errors.reps ? "border-destructive" : ""}
                />
                {errors.reps && (
                  <p className="text-sm text-destructive">{errors.reps}</p>
                )}
              </div>
            </div>

            {/* 強度 */}
            <div className="space-y-3">
              <Label>
                強度 <span className="text-primary font-medium">{intensity}%</span>
              </Label>
              <Slider
                value={[intensity]}
                onValueChange={(val) => setIntensity(val[0])}
                min={0}
                max={100}
                step={5}
                className="w-full max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                拖拉調整訓練強度 (0-100%)
              </p>
            </div>
          </div>
        </PageSection>

        {/* 備注與連結 */}
        <PageSection className="p-6">
          <PageSectionTitle unwrapped className="mb-4">備注與連結</PageSectionTitle>
          <div className="space-y-4">
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
        </PageSection>
      </div>
      
      {/* 離開確認對話框 */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要離開嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您有未儲存的變更，離開後將會遺失這些變更。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>繼續編輯</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave}>
              確定離開
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default ActionForm;
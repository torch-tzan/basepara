import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { GripVertical, Plus, X, Search, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type ActionItem, courseColorOptions, actionCategoryOptions, type ActionCategory, intensityOptions } from "@/data/trainingTemplates";
import { useTrainingData } from "@/contexts/TrainingDataContext";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { type CourseActionItem, generateCourseActionUid } from "@/types/courseAction";

const MAX_ACTIONS = 20;

const PersonalCourseForm = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const copyFromId = searchParams.get("copyFrom");
  const { toast } = useToast();
  const { 
    actions, 
    actionCategories,
    personalCourseCategories, 
    getPersonalCourseById, 
    getActionsByIds, 
    addPersonalCourse, 
    updatePersonalCourse,
  } = useTrainingData();
  
  // 課程分類選項：優先使用個人分類，如果沒有則使用公用課程分類
  const { courseCategories } = useTrainingData();
  const courseCategoryOptions = personalCourseCategories.length > 0
    ? personalCourseCategories.map((cat) => ({
        value: cat.name,
        label: cat.name,
      }))
    : courseCategories.map((cat) => ({
        value: cat.name,
        label: cat.name,
      }));
  
  const isEditMode = !!courseId;
  const isCopyMode = !!copyFromId;

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("red");
  const [selectedActions, setSelectedActions] = useState<CourseActionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [actionCategoryFilter, setActionCategoryFilter] = useState<ActionCategory | "">("");
  
  // 動作分類選項（從 Context 取得已排序的分類）
  const actionCategoryFilterOptions = actionCategories.map((cat) => ({
    value: cat.name,
    label: cat.name,
  }));
  
  // 檢查是否有篩選條件
  const hasFilters = searchQuery !== "" || categoryFilter !== "" || actionCategoryFilter !== "";
  
  // 清除所有篩選
  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setActionCategoryFilter("");
  };

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
    notes: string;
    color: string;
    actionUids: string[];
  } | null>(null);

  // 將 ActionItem 轉換為 CourseActionItem
  const actionToCourseActionItem = (action: ActionItem): CourseActionItem => ({
    uid: generateCourseActionUid(),
    actionId: action.id,
    name: action.name,
    category: action.category,
    actionCategory: action.actionCategory,
    sets: action.sets,
    reps: action.reps,
    intensity: action.intensity,
  });

  // Load course data if editing or copying
  useEffect(() => {
    const targetId = courseId || copyFromId;
    if (targetId) {
      const course = getPersonalCourseById(targetId);
      
      if (course) {
        // 如果是複製模式，加上「(複製)」後綴
        const courseName = isCopyMode ? `${course.name} (複製)` : course.name;
        setName(courseName);
        setCategory(course.category);
        setNotes(course.notes || "");
        // 確保顏色值有效，否則使用預設
        const validColor = courseColorOptions.find(opt => opt.value === course.color) 
          ? course.color 
          : "red";
        setColor(validColor || "red");
        
        // 載入課程的動作列表（轉換為 CourseActionItem）
        const courseActions = getActionsByIds(course.actionIds);
        const courseActionItems = courseActions.map(actionToCourseActionItem);
        setSelectedActions(courseActionItems);
        
        // 設定初始值（用於判斷是否有變更）
        initialValues.current = {
          name: courseName,
          category: course.category,
          notes: course.notes || "",
          color: validColor || "red",
          actionUids: courseActionItems.map(a => a.uid),
        };
      }
    } else {
      // 新增模式的初始值
      initialValues.current = {
        name: "",
        category: "",
        notes: "",
        color: "red",
        actionUids: [],
      };
    }
  }, [courseId, copyFromId, isCopyMode, getPersonalCourseById, getActionsByIds]);

  // 判斷表單是否有變更
  const hasChanges = useCallback(() => {
    if (!initialValues.current) return false;
    
    const currentActionUids = selectedActions.map((a) => a.uid);
    const initialActionUids = initialValues.current.actionUids;
    
    // 檢查動作列表是否相同（順序也要相同）
    const actionsChanged = 
      currentActionUids.length !== initialActionUids.length ||
      currentActionUids.some((uid, index) => uid !== initialActionUids[index]);
    
    // 檢查動作參數是否有變更
    const paramsChanged = selectedActions.some((action) => {
      const originalAction = actions.find(a => a.id === action.actionId);
      if (!originalAction) return false;
      return action.sets !== originalAction.sets ||
             action.reps !== originalAction.reps ||
             action.intensity !== originalAction.intensity;
    });
    
    return (
      name !== initialValues.current.name ||
      category !== initialValues.current.category ||
      notes !== initialValues.current.notes ||
      color !== initialValues.current.color ||
      actionsChanged ||
      paramsChanged
    );
  }, [name, category, notes, color, selectedActions, actions]);

  // Filter available actions (允許重複加入，不過濾已選)
  const availableActions = actions.filter(
    (action) =>
      (searchQuery === "" ||
        action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (categoryFilter === "" || action.category === categoryFilter) &&
      (actionCategoryFilter === "" || action.actionCategory === actionCategoryFilter)
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "請輸入課程名稱";
    }
    if (!category) {
      newErrors.category = "請選擇課程分類";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAction = (action: ActionItem) => {
    if (selectedActions.length >= MAX_ACTIONS) {
      toast({
        title: "已達上限",
        description: `一個課程最多只能包含 ${MAX_ACTIONS} 個動作`,
        variant: "destructive",
      });
      return;
    }
    setSelectedActions([...selectedActions, actionToCourseActionItem(action)]);
  };

  const handleRemoveAction = (uid: string) => {
    setSelectedActions(selectedActions.filter((a) => a.uid !== uid));
  };

  // 更新動作參數
  const handleUpdateActionParam = (uid: string, param: 'sets' | 'reps' | 'intensity', value: number) => {
    setSelectedActions(selectedActions.map((a) => 
      a.uid === uid ? { ...a, [param]: value } : a
    ));
  };

  // Drag and drop handlers for reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newActions = [...selectedActions];
    const [draggedItem] = newActions.splice(draggedIndex, 1);
    newActions.splice(targetIndex, 0, draggedItem);

    setSelectedActions(newActions);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // 將 CourseActionItem[] 轉換為儲存格式
      const courseActionData = selectedActions.map((action, index) => ({
        actionId: action.actionId,
        sortOrder: index,
        sets: action.sets,
        reps: action.reps,
        intensity: action.intensity,
      }));

      const courseData = {
        name: name.trim(),
        category,
        notes: notes.trim() || undefined,
        color,
        actionIds: selectedActions.map((a) => a.actionId),
        courseActions: courseActionData,
      };

      if (isEditMode && courseId) {
        // 更新現有課程
        await updatePersonalCourse(courseId, courseData);
        
        toast({
          title: "課程已更新",
          description: `「${name}」已成功更新`,
        });
      } else {
        // 新增課程
        await addPersonalCourse(courseData);
        
        toast({
          title: "課程已新增",
          description: `「${name}」已成功新增`,
        });
      }

      // 返回儲存的 URL 或預設路徑
      const returnUrl = sessionStorage.getItem("personalTemplatesReturnUrl");
      if (returnUrl) {
        sessionStorage.removeItem("personalTemplatesReturnUrl");
        // 提取路徑和參數
        const url = new URL(returnUrl);
        navigate(url.pathname + url.search);
      } else {
        navigate("/personal-templates");
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
      const returnUrl = sessionStorage.getItem("personalTemplatesReturnUrl");
      if (returnUrl) {
        sessionStorage.removeItem("personalTemplatesReturnUrl");
        const url = new URL(returnUrl);
        navigate(url.pathname + url.search);
      } else {
        navigate("/personal-templates");
      }
    }
  };

  const handleConfirmLeave = () => {
    setShowLeaveDialog(false);
    const returnUrl = sessionStorage.getItem("personalTemplatesReturnUrl");
    if (returnUrl) {
      sessionStorage.removeItem("personalTemplatesReturnUrl");
      const url = new URL(returnUrl);
      navigate(url.pathname + url.search);
    } else {
      navigate("/personal-templates");
    }
  };

  return (
    <AppLayout
      title={isEditMode ? "編輯個人課程" : isCopyMode ? "複製個人課程" : "新增個人課程"}
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
              isEditMode ? "儲存變更" : "新增課程"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Breadcrumb */}
        <PageBreadcrumb
          items={[
            { label: "個人範本", path: "/personal-templates" },
            { label: isEditMode ? name || "課程" : isCopyMode ? "複製課程" : "新增課程" },
          ]}
        />

        {/* 基本資訊 */}
        <PageSection className="p-6">
          <PageSectionTitle unwrapped className="mb-4">基本資訊</PageSectionTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="課程名稱"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="輸入課程名稱"
                error={errors.name}
              />
              <FormSelect
                label="課程分類"
                required
                value={category}
                onValueChange={setCategory}
                placeholder="選擇課程分類"
                options={courseCategoryOptions}
                error={errors.category}
              />
            </div>
            <FormTextarea
              label="備注"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="輸入課程備注說明（可選）"
              rows={3}
            />
            
            {/* 課程顏色 */}
            <div className="space-y-2">
              <Label>代表顏色</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
        </PageSection>

        {/* 課程動作 */}
        <PageSection className="p-6">
          <PageSectionTitle unwrapped className="mb-4">
            課程動作
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({selectedActions.length}/{MAX_ACTIONS})
            </span>
          </PageSectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 可選動作列表 */}
            <div className="bg-muted/30 rounded-lg border border-border p-4 flex flex-col h-[500px]">
              <h4 className="text-sm font-medium text-foreground mb-3">
                可選動作
              </h4>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="搜尋動作..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="分類" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionCategoryFilterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={actionCategoryFilter} onValueChange={(v) => setActionCategoryFilter(v as ActionCategory | "")}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="動作分類" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionCategoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-9 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    清除篩選
                  </Button>
                )}
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {availableActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {hasFilters ? "找不到符合的動作" : "沒有可選動作"}
                  </p>
                ) : (
                  availableActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-3 bg-card rounded-md border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {action.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{action.category}</span>
                          <span>•</span>
                          <span>{action.actionCategory}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleAddAction(action)}
                        disabled={selectedActions.length >= MAX_ACTIONS}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 已選動作列表 */}
            <div className="bg-muted/30 rounded-lg border border-border p-4 flex flex-col h-[500px]">
              <h4 className="text-sm font-medium text-foreground mb-3">
                已選動作（拖拉排序）
              </h4>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {selectedActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    尚未選擇任何動作
                  </p>
                ) : (
                  selectedActions.map((action, index) => (
                    <div
                      key={action.uid}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 bg-card rounded-md border transition-all ${
                        draggedIndex === index
                          ? "opacity-50 border-primary"
                          : dragOverIndex === index
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
                        <span className="w-6 h-6 flex items-center justify-center text-xs font-medium bg-primary/10 text-primary rounded">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {action.name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {action.category}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveAction(action.uid)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* 參數調整區 */}
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-3">
                        {/* 組數 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">組數</Label>
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            value={action.sets}
                            onChange={(e) => {
                              const val = e.target.value;
                              const num = parseInt(val);
                              if (val === "" || (num >= 1 && num <= 99)) {
                                handleUpdateActionParam(action.uid, 'sets', num || 1);
                              }
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                        
                        {/* 次數 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">次數</Label>
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            value={action.reps}
                            onChange={(e) => {
                              const val = e.target.value;
                              const num = parseInt(val);
                              if (val === "" || (num >= 1 && num <= 99)) {
                                handleUpdateActionParam(action.uid, 'reps', num || 1);
                              }
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                        
                        {/* 強度 */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">強度</Label>
                          <Select 
                            value={String(action.intensity)} 
                            onValueChange={(v) => handleUpdateActionParam(action.uid, 'intensity', parseInt(v))}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {intensityOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </PageSection>
      </div>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要離開嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您有尚未儲存的變更，離開後將會遺失這些變更。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>繼續編輯</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave}>
              離開
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default PersonalCourseForm;

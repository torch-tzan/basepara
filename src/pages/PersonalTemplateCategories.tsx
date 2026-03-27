import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GripVertical, Plus, Trash2, Edit2, Check, X, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { useTrainingData, type CategoryItem, UNCATEGORIZED } from "@/contexts/TrainingDataContext";

const PersonalTemplateCategories = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    personalCourseCategories,
    addPersonalCourseCategory,
    updatePersonalCourseCategory,
    deletePersonalCourseCategory,
    getPersonalCoursesCategoryUsage,
    reorderPersonalCourseCategories,
  } = useTrainingData();

  // Local state for categories (including order changes)
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [categoryUsageCount, setCategoryUsageCount] = useState(0);
  
  // Track if order has changed
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const initialOrderRef = useRef<string[]>([]);

  // Sync with context data
  useEffect(() => {
    setCategories(personalCourseCategories);
    initialOrderRef.current = personalCourseCategories.map(c => c.id);
    setHasOrderChanged(false);
  }, [personalCourseCategories]);

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "請輸入分類名稱",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate
    if (categories.some(c => c.name === newCategoryName.trim())) {
      toast({
        title: "分類名稱已存在",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addPersonalCourseCategory(newCategoryName.trim());
      setNewCategoryName("");
      toast({
        title: "分類已新增",
        description: `「${newCategoryName.trim()}」已成功新增`,
      });
    } catch (error) {
      toast({
        title: "新增失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing
  const handleStartEdit = (category: CategoryItem) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;

    // Check for duplicate (excluding current)
    if (categories.some(c => c.id !== editingId && c.name === editingName.trim())) {
      toast({
        title: "分類名稱已存在",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePersonalCourseCategory(editingId, editingName.trim());
      setEditingId(null);
      setEditingName("");
      toast({
        title: "分類已更新",
      });
    } catch (error) {
      toast({
        title: "更新失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete dialog
  const handleDeleteClick = (category: CategoryItem) => {
    const usage = getPersonalCoursesCategoryUsage(category.name);
    setCategoryToDelete(category);
    setCategoryUsageCount(usage.length);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsSubmitting(true);
    try {
      await deletePersonalCourseCategory(categoryToDelete.id);
      toast({
        title: "分類已刪除",
        description: categoryUsageCount > 0 
          ? `「${categoryToDelete.name}」已刪除，${categoryUsageCount} 個課程已移至「${UNCATEGORIZED}」`
          : `「${categoryToDelete.name}」已成功刪除`,
      });
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Drag and drop handlers
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

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedItem);

    setCategories(newCategories);
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    // Check if order has changed from initial
    const newOrder = newCategories.map(c => c.id);
    const orderChanged = newOrder.some((id, index) => id !== initialOrderRef.current[index]);
    setHasOrderChanged(orderChanged);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Save order changes
  const handleSaveOrder = async () => {
    setIsSubmitting(true);
    try {
      await reorderPersonalCourseCategories(categories.map(c => c.id));
      initialOrderRef.current = categories.map(c => c.id);
      setHasOrderChanged(false);
      toast({
        title: "排序已儲存",
      });
    } catch (error) {
      toast({
        title: "儲存失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="編輯個人分類"
      headerAction={
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/personal-templates")}>
            返回
          </Button>
          {hasOrderChanged && (
            <Button onClick={handleSaveOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                "儲存排序"
              )}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        {/* Breadcrumb */}
        <PageBreadcrumb
          items={[
            { label: "個人範本", path: "/personal-templates" },
            { label: "編輯分類" },
          ]}
        />

        {/* Add Category */}
        <PageSection className="p-6">
          <PageSectionTitle unwrapped className="mb-4">新增分類</PageSectionTitle>
          <div className="flex items-center gap-3">
            <Input
              placeholder="輸入分類名稱..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              className="max-w-md"
            />
            <Button onClick={handleAddCategory} disabled={isSubmitting || !newCategoryName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              新增
            </Button>
          </div>
        </PageSection>

        {/* Categories List */}
        <PageSection className="p-6">
          <PageSectionTitle unwrapped className="mb-4">
            分類列表
            <span className="text-sm font-normal text-muted-foreground ml-2">
              （拖拉排序）
            </span>
          </PageSectionTitle>
          
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              尚未建立任何分類
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  draggable={editingId !== category.id}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 bg-card rounded-md border transition-colors ${
                    dragOverIndex === index ? "border-primary" : "border-border"
                  } ${editingId !== category.id ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  
                  {editingId === category.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={handleSaveEdit}
                        disabled={isSubmitting}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{category.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {getPersonalCoursesCategoryUsage(category.name).length} 個課程
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(category)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(category)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </PageSection>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除分類？</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryUsageCount > 0 ? (
                <>
                  「{categoryToDelete?.name}」分類下有 {categoryUsageCount} 個課程，
                  刪除後這些課程將會移至「{UNCATEGORIZED}」。
                </>
              ) : (
                <>您即將刪除「{categoryToDelete?.name}」分類，此操作無法復原。</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  刪除中...
                </>
              ) : (
                "刪除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default PersonalTemplateCategories;

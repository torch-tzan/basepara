import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Edit, Trash2, GripVertical, Undo2, Redo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTrainingData, type CategoryItem, UNCATEGORIZED } from "@/contexts/TrainingDataContext";

// Local category type with count and pending state
type LocalCategory = CategoryItem & { 
  count: number; 
  isNew?: boolean;
  originalName?: string;
};

const TemplateCategories = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const { toast } = useToast();
  const {
    courseCategories,
    actionCategories,
    addCourseCategory,
    updateCourseCategory,
    deleteCourseCategory,
    getCoursesCategoryUsage,
    reorderCourseCategories,
    addActionCategory,
    updateActionCategory,
    deleteActionCategory,
    getActionsCategoryUsage,
    reorderActionCategories,
  } = useTrainingData();
  
  const isPublic = type === "public";
  const pageTitle = isPublic ? "編輯公用分類" : "編輯公用動作分類";
  const itemLabel = isPublic ? "課程" : "動作";
  
  // 從 context 獲取分類
  const contextCategories = isPublic ? courseCategories : actionCategories;
  
  // 計算每個分類的使用數量
  const getCategoryUsageCount = useCallback((categoryName: string) => {
    if (isPublic) {
      return getCoursesCategoryUsage(categoryName).length;
    }
    return getActionsCategoryUsage(categoryName).length;
  }, [isPublic, getCoursesCategoryUsage, getActionsCategoryUsage]);
  
  // 建立包含 count 的分類列表
  const initialCategories = useMemo(() => {
    return contextCategories.map((cat) => ({
      ...cat,
      count: getCategoryUsageCount(cat.name),
      originalName: cat.name,
    }));
  }, [contextCategories, getCategoryUsageCount]);
  
  const [categories, setCategories] = useState<LocalCategory[]>(initialCategories);
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string; count: number } | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [nextLocalId, setNextLocalId] = useState(-1);
  
  // Undo/Redo history
  type HistoryState = { categories: LocalCategory[]; deletedIds: string[] };
  const [history, setHistory] = useState<HistoryState[]>([{ categories: initialCategories, deletedIds: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // 當 context 資料變化時更新本地狀態（僅初始化）
  useEffect(() => {
    const updated = contextCategories.map((cat) => ({
      ...cat,
      count: getCategoryUsageCount(cat.name),
      originalName: cat.name,
    }));
    setCategories(updated);
    setDeletedCategoryIds([]);
    setHistory([{ categories: updated, deletedIds: [] }]);
    setHistoryIndex(0);
  }, [contextCategories, getCategoryUsageCount]);

  const hasUnsavedChanges = useMemo(() => {
    // Check if there are deleted categories
    if (deletedCategoryIds.length > 0) return true;
    
    // Check if there are new categories
    if (categories.some(cat => cat.isNew)) return true;
    
    // Check if names have changed
    if (categories.some(cat => cat.originalName && cat.name !== cat.originalName)) return true;
    
    // Check if order has changed
    const originalIds = initialCategories.map(c => c.id);
    const currentIds = categories.filter(c => !c.isNew).map(c => c.id);
    if (JSON.stringify(originalIds) !== JSON.stringify(currentIds)) return true;
    
    return false;
  }, [categories, deletedCategoryIds, initialCategories]);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  const updateWithHistory = (newCategories: LocalCategory[], newDeletedIds: string[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ categories: newCategories, deletedIds: newDeletedIds });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCategories(newCategories);
    setDeletedCategoryIds(newDeletedIds);
  };

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      const newCategories = categories.map(cat => 
        cat.id === id ? { ...cat, name: editingName.trim() } : cat
      );
      updateWithHistory(newCategories, deletedCategoryIds);
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDeleteClick = (id: string, name: string, count: number) => {
    setCategoryToDelete({ id, name, count });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      const newCategories = categories.filter(cat => cat.id !== categoryToDelete.id);
      // Only track deletion if it's not a new (unsaved) category
      const isNewCategory = categories.find(c => c.id === categoryToDelete.id)?.isNew;
      const newDeletedIds = isNewCategory 
        ? deletedCategoryIds 
        : [...deletedCategoryIds, categoryToDelete.id];
      
      updateWithHistory(newCategories, newDeletedIds);
      
      toast({
        title: "分類已標記刪除",
        description: "儲存後才會正式刪除",
      });
    }
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 0;
      const newCategory: LocalCategory = {
        id: `temp_${nextLocalId}`,
        name: newCategoryName.trim(),
        order: maxOrder,
        count: 0,
        isNew: true,
      };
      setNextLocalId(prev => prev - 1);
      updateWithHistory([...categories, newCategory], deletedCategoryIds);
      setNewCategoryName("");
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) return;

    const draggedIndex = categories.findIndex(c => c.id === draggedId);
    const targetIndex = categories.findIndex(c => c.id === targetId);

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedItem);

    updateWithHistory(newCategories, deletedCategoryIds);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCategories(history[newIndex].categories);
      setDeletedCategoryIds(history[newIndex].deletedIds);
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCategories(history[newIndex].categories);
      setDeletedCategoryIds(history[newIndex].deletedIds);
    }
  };
  
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setLeaveDialogOpen(true);
    } else {
      navigate("/templates");
    }
  };

  const handleConfirmLeave = () => {
    setLeaveDialogOpen(false);
    navigate("/templates");
  };

  const handleSave = useCallback(async () => {
    // 1. Delete categories
    for (const id of deletedCategoryIds) {
      if (isPublic) {
        await deleteCourseCategory(id);
      } else {
        await deleteActionCategory(id);
      }
    }

    // 2. Add new categories and update names
    const newCategoryIdMap = new Map<string, string>(); // Map local id to real id
    for (const cat of categories) {
      if (cat.isNew) {
        // Add new category
        const created = isPublic 
          ? await addCourseCategory(cat.name)
          : await addActionCategory(cat.name);
        newCategoryIdMap.set(cat.id, created.id);
      } else if (cat.originalName && cat.name !== cat.originalName) {
        // Update category name
        if (isPublic) {
          await updateCourseCategory(cat.id, cat.name);
        } else {
          await updateActionCategory(cat.id, cat.name);
        }
      }
    }

    // 3. Update order - map local ids to real ids for new categories
    const orderedIds = categories
      .filter(cat => !deletedCategoryIds.includes(cat.id))
      .map(cat => cat.isNew ? newCategoryIdMap.get(cat.id) ?? cat.id : cat.id);
    
    if (isPublic) {
      await reorderCourseCategories(orderedIds);
    } else {
      await reorderActionCategories(orderedIds);
    }

    toast({
      title: "已儲存",
      description: "分類設定已更新",
    });
    navigate("/templates");
  }, [
    categories, 
    deletedCategoryIds, 
    isPublic, 
    addCourseCategory, 
    addActionCategory, 
    updateCourseCategory, 
    updateActionCategory, 
    deleteCourseCategory, 
    deleteActionCategory, 
    reorderCourseCategories,
    reorderActionCategories,
    toast, 
    navigate
  ]);

  return (
    <AppLayout
      title={pageTitle}
      headerAction={
        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleUndo}
              disabled={!canUndo}
              title="復原"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleRedo}
              disabled={!canRedo}
              title="重複"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
          {/* Cancel / Save */}
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!hasUnsavedChanges}>
            儲存變更
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Breadcrumb */}
        <PageBreadcrumb
          items={[
            { label: "公用範本", path: "/templates" },
            { label: pageTitle },
          ]}
        />

        {/* Add New Category */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-medium text-foreground mb-4">新增分類</h3>
          <div className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="輸入新分類名稱..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              className="w-1/2"
            />
            <Button onClick={handleAddCategory} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新增
            </Button>
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">分類列表</h3>
            <p className="text-sm text-muted-foreground mt-1">
              共 {categories.length} 個分類，拖拉調整順序
            </p>
          </div>
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div
                key={category.id}
                draggable={editingId !== category.id}
                onDragStart={(e) => handleDragStart(e, category.id)}
                onDragOver={(e) => handleDragOver(e, category.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, category.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-4 transition-all ${
                  draggedId === category.id 
                    ? "opacity-50 bg-accent/30" 
                    : dragOverId === category.id 
                      ? "bg-accent border-t-2 border-primary" 
                      : "hover:bg-accent/50"
                }`}
              >
                <GripVertical 
                  className={`w-4 h-4 text-muted-foreground ${
                    editingId !== category.id ? "cursor-grab active:cursor-grabbing" : ""
                  }`} 
                />
                
                {editingId === category.id ? (
                  <div className="flex-1 flex items-center gap-3">
                    <Input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(category.id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      className="flex-1 max-w-md"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleSaveEdit(category.id)}>
                      儲存
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      取消
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="text-foreground font-medium">
                        {category.name}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({category.count} 個{itemLabel})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(category.id, category.name)}
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteClick(category.id, category.name, category.count)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <p className="text-sm text-muted-foreground">
          提示：刪除分類後，該分類下的{itemLabel}將會移至「{UNCATEGORIZED}」分類。
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除分類</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete?.count && categoryToDelete.count > 0 ? (
                <>
                  「{categoryToDelete?.name}」分類下有 <span className="font-semibold text-destructive">{categoryToDelete.count} 個{itemLabel}</span> 正在使用中。
                  <br /><br />
                  刪除後，這些{itemLabel}將會移至「{UNCATEGORIZED}」分類。確定要繼續嗎？
                </>
              ) : (
                <>確定要刪除「{categoryToDelete?.name}」分類嗎？</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
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

export default TemplateCategories;

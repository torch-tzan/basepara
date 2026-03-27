import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TabNav, TabNavItem } from "@/components/ui/tab-nav";
import { PageSection, PageSectionTitle } from "@/components/ui/page-section";
import { TablePagination } from "@/components/ui/table-pagination";
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
import { Plus, Edit, Search, Trash2, Copy, X } from "lucide-react";
import { type ActionItem, type CourseItem, actionCategoryOptions, type ActionCategory, getCourseColorValue } from "@/data/trainingTemplates";
import { useTrainingData, UNCATEGORIZED } from "@/contexts/TrainingDataContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const templateTypeTabs = ["訓練課程", "訓練動作"];

const Templates = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { permissions } = usePermissions();
  const canEdit = permissions.templates.canEdit;
  const { 
    templates, 
    courses, 
    actions, 
    deleteAction, 
    deleteCourse,
    getActionUsageInCourses,
  } = useTrainingData();
  
  // 從 URL 讀取初始狀態
  const getInitialTypeTab = () => {
    const type = searchParams.get("type");
    return type === "action" ? "訓練動作" : "訓練課程";
  };
  
  const getInitialCategoryTab = () => {
    return searchParams.get("category") || "全部";
  };
  
  const getInitialSearch = () => {
    return searchParams.get("search") || "";
  };
  
  const getInitialActionCategory = () => {
    const filter = searchParams.get("actionCategory");
    if (filter && actionCategoryOptions.some(opt => opt.value === filter)) {
      return filter as ActionCategory;
    }
    return "";
  };
  
  const [activeTypeTab, setActiveTypeTab] = useState(getInitialTypeTab);
  const [activeCategoryTab, setActiveCategoryTab] = useState(getInitialCategoryTab);
  const [searchQuery, setSearchQuery] = useState(getInitialSearch);
  const [actionCategoryFilter, setActionCategoryFilter] = useState<ActionCategory | "">(getInitialActionCategory);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // 刪除確認 Dialog 狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ 
    id: string; 
    name: string; 
    type: "course" | "action";
    usageCount?: number;
    usageDetails?: string[];
  } | null>(null);
  
  // 同步狀態到 URL
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // 類型 Tab
    if (activeTypeTab === "訓練動作") {
      params.set("type", "action");
    }
    
    // 分類 Tab
    if (activeCategoryTab !== "全部") {
      params.set("category", activeCategoryTab);
    }
    
    // 搜尋
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    
    // 動作分類篩選
    if (actionCategoryFilter && activeTypeTab === "訓練動作") {
      params.set("actionCategory", actionCategoryFilter);
    }
    
    setSearchParams(params, { replace: true });
  }, [activeTypeTab, activeCategoryTab, searchQuery, actionCategoryFilter, setSearchParams]);
  
  // 當篩選條件變更時更新 URL
  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);
  
  // 根據當前 Tab 取得對應的分類
  const currentType = activeTypeTab === "訓練課程" ? "public" : "action";
  
  // 從 context 資料取得分類（包含未分類）
  const categoryTabs = useMemo(() => {
    const data = currentType === "public" ? courses : actions;
    const categories = [...new Set(data.map((t) => t.category))];
    // 將「未分類」移至最後
    const sorted = categories.filter(c => c !== UNCATEGORIZED);
    if (categories.includes(UNCATEGORIZED)) {
      sorted.push(UNCATEGORIZED);
    }
    return ["全部", ...sorted];
  }, [currentType, courses, actions]);
  
  // 儲存當前 URL 並導航到表單頁面
  const navigateToForm = (path: string) => {
    sessionStorage.setItem("templatesReturnUrl", window.location.href);
    navigate(path);
  };
  
  // 處理新增動作
  const handleAddAction = () => {
    navigateToForm("/templates/action/add");
  };
  
  // 處理編輯動作
  const handleEditAction = (action: ActionItem) => {
    navigateToForm(`/templates/action/${action.id}`);
  };
  
  // 處理複製動作
  const handleCopyAction = (action: ActionItem) => {
    navigateToForm(`/templates/action/add?copyFrom=${action.id}`);
    toast({
      title: "已複製動作",
      description: `正在複製「${action.name}」，請修改後儲存`,
    });
  };
  
  // 處理複製課程
  const handleCopyCourse = (courseId: string, courseName: string) => {
    navigateToForm(`/templates/course/add?copyFrom=${courseId}`);
    toast({
      title: "已複製課程",
      description: `正在複製「${courseName}」，請修改後儲存`,
    });
  };
  
  // 處理刪除點擊
  const handleDeleteClick = (id: string, name: string, type: "course" | "action") => {
    if (type === "action") {
      // 檢查動作是否被課程使用
      const usedInCourses = getActionUsageInCourses(id);
      setItemToDelete({ 
        id, 
        name, 
        type,
        usageCount: usedInCourses.length,
        usageDetails: usedInCourses.map(c => c.name),
      });
    } else {
      setItemToDelete({ id, name, type });
    }
    setDeleteDialogOpen(true);
  };
  
  // Get audit log functions
  const { logCourseDeleted } = useAuditLog();
  
  // 確認刪除
  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      const typeLabel = itemToDelete.type === "course" ? "課程" : "動作";
      
      if (itemToDelete.type === "course") {
        await deleteCourse(itemToDelete.id);
        // Log course deletion
        await logCourseDeleted(itemToDelete.id, itemToDelete.name);
      } else {
        await deleteAction(itemToDelete.id);
        // Note: Action deletion logging could be added here if needed
      }
      
      const description = itemToDelete.type === "action" && itemToDelete.usageCount && itemToDelete.usageCount > 0
        ? `「${itemToDelete.name}」已刪除，已從 ${itemToDelete.usageCount} 個課程中移除`
        : `「${itemToDelete.name}」已成功刪除`;
      
      toast({
        title: `${typeLabel}已刪除`,
        description,
      });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
  return (
    <AppLayout title="公用範本">
      {/* Type Tabs */}
      <div className="bg-card border-b border-border -mx-6 -mt-6 px-6">
        <div className="flex items-center justify-between py-3">
          <TabNav>
            {templateTypeTabs.map(tab => (
              <TabNavItem
                key={tab}
                active={activeTypeTab === tab}
                variant="pill"
                onClick={() => {
                  setActiveTypeTab(tab);
                  setActiveCategoryTab("全部");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
              >
                {tab}
              </TabNavItem>
            ))}
          </TabNav>
          {canEdit && (
            <div className="flex items-center gap-3">
              <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate(`/templates/categories/${activeTypeTab === "訓練課程" ? "public" : "personal"}`)}>
                <Edit className="w-4 h-4" />
                {activeTypeTab === "訓練課程" ? "編輯公用分類" : "編輯公用動作分類"}
              </Button>
              <Button 
                className="flex items-center gap-2"
                onClick={() => {
                  if (activeTypeTab === "訓練動作") {
                    handleAddAction();
                  } else {
                    navigateToForm("/templates/course/add");
                  }
                }}
              >
                <Plus className="w-4 h-4" />
                {activeTypeTab === "訓練課程" ? "新增公用課程" : "新增動作"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Action Category Tabs (僅在訓練動作 Tab 顯示) */}
      {activeTypeTab === "訓練動作" && (
        <div className="bg-muted/30 border-b border-border -mx-6 px-6">
          <TabNav className="py-2">
            <TabNavItem
              active={actionCategoryFilter === ""}
              variant="pill"
              onClick={() => {
                setActionCategoryFilter("");
                setCurrentPage(1);
              }}
            >
              全部
            </TabNavItem>
            {actionCategoryOptions.map((option) => (
              <TabNavItem
                key={option.value}
                active={actionCategoryFilter === option.value}
                variant="pill"
                onClick={() => {
                  setActionCategoryFilter(option.value as ActionCategory);
                  setCurrentPage(1);
                }}
              >
                {option.label}
              </TabNavItem>
            ))}
          </TabNav>
        </div>
      )}

      <div className="space-y-6 pt-8">
        {/* Search Section */}
        <PageSection className="p-6">
          <PageSectionTitle unwrapped className="mb-4">{activeTypeTab === "訓練課程" ? "搜尋訓練課程" : "搜尋訓練動作"}</PageSectionTitle>
          <div className="flex items-center gap-4">
            {/* 搜尋 bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder={activeTypeTab === "訓練課程" ? "搜尋課程名稱..." : "搜尋動作名稱..."} 
                className="pl-10"
                defaultValue={searchQuery}
                onValueChange={(value) => {
                  setSearchQuery(value);
                  setCurrentPage(1);
                }}
              />
            </div>
            {/* 分類下拉選單 */}
            <div className="w-48">
              <Select
                value={activeCategoryTab}
                onValueChange={(value) => {
                  setActiveCategoryTab(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="分類" />
                </SelectTrigger>
                <SelectContent>
                  {categoryTabs.map((tab) => (
                    <SelectItem key={tab} value={tab}>
                      {tab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PageSection>

        {/* Templates Grid */}
        {(() => {
          const filteredData = templates.filter(t => {
            const typeMatch = t.type === currentType;
            const categoryMatch = activeCategoryTab === "全部" || t.category === activeCategoryTab;
            const searchMatch = searchQuery === "" || 
              t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.category.toLowerCase().includes(searchQuery.toLowerCase());
            // 動作分類篩選（僅對動作生效）
            const actionCategoryMatch = currentType !== "action" || 
              actionCategoryFilter === "" || 
              (t.type === "action" && (t as ActionItem).actionCategory === actionCategoryFilter);
            return typeMatch && categoryMatch && searchMatch && actionCategoryMatch;
          });
          
          const typeLabel = activeTypeTab === "訓練課程" ? "課程" : "動作";
          
          // Pagination calculations
          const totalItems = filteredData.length;
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
          const displayData = filteredData.slice(startIndex, endIndex);
          
          return (
            <>
              {/* 結果數量 */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  共 <span className="font-medium text-foreground">{totalItems}</span> 個{typeLabel}
                  {searchQuery && (
                    <span className="ml-1">
                      （搜尋「{searchQuery}」）
                    </span>
                  )}
                </p>
              </div>
              
              {/* 空結果提示 */}
              {filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-card rounded-lg border border-border">
                  <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    找不到{typeLabel}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    {searchQuery 
                      ? `沒有符合「${searchQuery}」的${typeLabel}，請嘗試其他關鍵字或清除搜尋條件。`
                      : `目前尚無${typeLabel}，請點擊「新增${typeLabel}」按鈕建立第一個${typeLabel}。`
                    }
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearchQuery("")}
                    >
                      清除搜尋
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayData.map((template) => {
                      const isAction = template.type === "action";
                      const actionItem = isAction ? (template as ActionItem) : null;
                      const courseItem = template.type === "public" ? (template as CourseItem) : null;
                      
                      return (
                        <Card key={template.id} hover className="p-6 cursor-pointer">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
                                {courseItem && (
                                  <span 
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getCourseColorValue(courseItem.color) }}
                                  />
                                )}
                                {template.name}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-block px-2 py-1 bg-accent text-muted-foreground text-xs rounded">
                                  {template.category}
                                </span>
                                {actionItem && (
                                  <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                                    {actionItem.actionCategory}
                                  </span>
                                )}
                              </div>
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (actionItem) {
                                      handleEditAction(actionItem);
                                    } else {
                                      navigateToForm(`/templates/course/${template.id}`);
                                    }
                                  }}
                                  title="編輯"
                                >
                                  <Edit className="w-4 h-4 text-muted-foreground" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (actionItem) {
                                      handleCopyAction(actionItem);
                                    } else {
                                      handleCopyCourse(template.id, template.name);
                                    }
                                  }}
                                  title="複製"
                                >
                                  <Copy className="w-4 h-4 text-muted-foreground" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(template.id, template.name, template.type === "public" ? "course" : "action");
                                  }}
                                  title="刪除"
                                >
                                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {/* 課程詳細資訊 */}
                          {courseItem && (
                            <div className="text-xs text-muted-foreground space-y-1 mb-3">
                              <div>包含 {courseItem.actionIds.length} 個動作</div>
                              {courseItem.notes && (
                                <div className="line-clamp-2 text-muted-foreground/80">
                                  {courseItem.notes}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* 動作詳細資訊 */}
                          {actionItem && (
                            <div className="text-xs text-muted-foreground space-y-1 mb-3">
                              <div className="flex gap-4">
                                <span>組數: {actionItem.sets}</span>
                                <span>次數: {actionItem.reps}</span>
                                <span>強度: {actionItem.intensity}%</span>
                              </div>
                              {actionItem.bat && <div>球棒: {actionItem.bat}</div>}
                              {actionItem.equipment && actionItem.equipment !== "無" && (
                                <div>輔具: {actionItem.equipment}</div>
                              )}
                              {actionItem.notes && (
                                <div className="line-clamp-2 text-muted-foreground/80 mt-1">
                                  {actionItem.notes}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            最後更新：{template.updatedAt}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {/* Pagination */}
                  {totalItems > 0 && (
                    <div className="mt-6">
                      <TablePagination
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(value) => {
                          setItemsPerPage(value);
                          setCurrentPage(1);
                        }}
                        itemsPerPageOptions={[
                          { value: "12", label: "12 筆" },
                          { value: "24", label: "24 筆" },
                          { value: "48", label: "48 筆" },
                        ]}
                        standalone
                      />
                    </div>
                  )}
                </>
              )}
            </>
          );
        })()}
      </div>
      
      {/* 刪除確認 Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除{itemToDelete?.type === "course" ? "課程" : "動作"}</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === "action" && itemToDelete?.usageCount && itemToDelete.usageCount > 0 ? (
                <>
                  「{itemToDelete?.name}」正被 <span className="font-semibold text-destructive">{itemToDelete.usageCount} 個課程</span> 使用中：
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    {itemToDelete.usageDetails?.slice(0, 5).map((courseName, i) => (
                      <li key={i}>{courseName}</li>
                    ))}
                    {itemToDelete.usageDetails && itemToDelete.usageDetails.length > 5 && (
                      <li>...還有 {itemToDelete.usageDetails.length - 5} 個課程</li>
                    )}
                  </ul>
                  <br />
                  刪除後，此動作將從所有課程中移除。確定要繼續嗎？
                </>
              ) : (
                <>確定要刪除「{itemToDelete?.name}」嗎？此操作無法復原。</>
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
    </AppLayout>
  );
};

export default Templates;

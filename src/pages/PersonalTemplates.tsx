import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Edit, Search, Trash2, Copy, Loader2 } from "lucide-react";
import { getCourseColorValue } from "@/data/trainingTemplates";
import { useTrainingData, UNCATEGORIZED, type PersonalCourseItem } from "@/contexts/TrainingDataContext";
import { useToast } from "@/hooks/use-toast";

const PersonalTemplates = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { 
    personalCourses, 
    personalCourseCategories,
    deletePersonalCourse,
    isLoadingPersonal,
  } = useTrainingData();
  
  // 從 URL 讀取初始狀態
  const getInitialCategoryTab = () => {
    return searchParams.get("category") || "全部";
  };
  
  const getInitialSearch = () => {
    return searchParams.get("search") || "";
  };
  
  const [activeCategoryTab, setActiveCategoryTab] = useState(getInitialCategoryTab);
  const [searchQuery, setSearchQuery] = useState(getInitialSearch);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // 刪除確認 Dialog 狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ 
    id: string; 
    name: string; 
  } | null>(null);
  
  // 同步狀態到 URL
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // 分類 Tab
    if (activeCategoryTab !== "全部") {
      params.set("category", activeCategoryTab);
    }
    
    // 搜尋
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    
    setSearchParams(params, { replace: true });
  }, [activeCategoryTab, searchQuery, setSearchParams]);
  
  // 當篩選條件變更時更新 URL
  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);
  
  // 從 context 資料取得分類（包含未分類）
  const categoryTabs = useMemo(() => {
    const categories = [...new Set(personalCourses.map((c) => c.category))];
    // 將「未分類」移至最後
    const sorted = categories.filter(c => c !== UNCATEGORIZED);
    if (categories.includes(UNCATEGORIZED)) {
      sorted.push(UNCATEGORIZED);
    }
    return ["全部", ...sorted];
  }, [personalCourses]);
  
  // 儲存當前 URL 並導航到表單頁面
  const navigateToForm = (path: string) => {
    sessionStorage.setItem("personalTemplatesReturnUrl", window.location.href);
    navigate(path);
  };
  
  // 處理新增課程
  const handleAddCourse = () => {
    navigateToForm("/personal-templates/add");
  };
  
  // 處理編輯課程
  const handleEditCourse = (course: PersonalCourseItem) => {
    navigateToForm(`/personal-templates/${course.id}`);
  };
  
  // 處理複製課程
  const handleCopyCourse = (course: PersonalCourseItem) => {
    navigateToForm(`/personal-templates/add?copyFrom=${course.id}`);
    toast({
      title: "已複製課程",
      description: `正在複製「${course.name}」，請修改後儲存`,
    });
  };
  
  // 處理刪除點擊
  const handleDeleteClick = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteDialogOpen(true);
  };
  
  // 確認刪除
  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      setIsDeleting(true);
      try {
        await deletePersonalCourse(itemToDelete.id);
        
        toast({
          title: "課程已刪除",
          description: `「${itemToDelete.name}」已成功刪除`,
        });
      } catch (error) {
        toast({
          title: "刪除失敗",
          description: "請稍後再試",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      }
    }
  };
  
  // Loading state
  if (isLoadingPersonal) {
    return (
      <AppLayout title="個人範本">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout title="個人範本">
      {/* Header with Add Button */}
      <div className="bg-card border-b border-border -mx-6 -mt-6 px-6">
        <div className="flex items-center justify-between py-3">
          <div className="text-sm text-muted-foreground">
            個人專屬的訓練課程範本，僅自己可見
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate("/personal-templates/categories")}>
              <Edit className="w-4 h-4" />
              編輯個人分類
            </Button>
            <Button className="flex items-center gap-2" onClick={handleAddCourse}>
              <Plus className="w-4 h-4" />
              新增個人課程
            </Button>
          </div>
        </div>
      </div>


      <div className="space-y-6 pt-8">
        {/* Search Section */}
        <PageSection className="p-6">
          <PageSectionTitle unwrapped className="mb-4">搜尋個人課程</PageSectionTitle>
          <div className="flex items-center gap-4">
            {/* 搜尋 bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="搜尋課程名稱..." 
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

        {/* Courses Grid */}
        {(() => {
          const filteredData = personalCourses.filter(course => {
            const categoryMatch = activeCategoryTab === "全部" || course.category === activeCategoryTab;
            const searchMatch = searchQuery === "" || 
              course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              course.category.toLowerCase().includes(searchQuery.toLowerCase());
            return categoryMatch && searchMatch;
          });
          
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
                  共 <span className="font-medium text-foreground">{totalItems}</span> 個課程
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
                    找不到課程
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    {searchQuery 
                      ? `沒有符合「${searchQuery}」的課程，請嘗試其他關鍵字或清除搜尋條件。`
                      : `目前尚無個人課程，請點擊「新增個人課程」按鈕建立第一個課程。`
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
                    {displayData.map((course) => (
                      <Card key={course.id} hover className="p-6 cursor-pointer">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
                              <span 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: getCourseColorValue(course.color) }}
                              />
                              {course.name}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-block px-2 py-1 bg-accent text-muted-foreground text-xs rounded">
                                {course.category}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCourse(course);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCourse(course);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(course.id, course.name);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {course.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.notes}
                          </p>
                        )}
                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                          <span>{course.actionIds.length} 個動作</span>
                          <span>更新於 {course.updatedAt}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalItems > itemsPerPage && (
                    <div className="mt-6">
                      <TablePagination
                        totalItems={totalItems}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(newItemsPerPage) => {
                          setItemsPerPage(newItemsPerPage);
                          setCurrentPage(1);
                        }}
                        itemsPerPageOptions={[
                          { value: "12", label: "12 筆" },
                          { value: "24", label: "24 筆" },
                          { value: "48", label: "48 筆" },
                        ]}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          );
        })()}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除課程？</AlertDialogTitle>
            <AlertDialogDescription>
              您即將刪除「{itemToDelete?.name}」，此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
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

export default PersonalTemplates;

import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { History, Search, Filter, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination } from "@/components/ui/table-pagination";
import { useAuditLogs, actionTypeLabels, targetTypeLabels, AuditLogRecord } from "@/hooks/useAuditLogs";
import { Database } from "@/integrations/supabase/types";

type AuditActionType = Database["public"]["Enums"]["audit_action_type"];

const ITEMS_PER_PAGE = 15;

// Group action types for filter
const actionTypeGroups: { label: string; types: AuditActionType[] }[] = [
  {
    label: "帳號操作",
    types: [
      "account_created",
      "account_updated",
      "account_deleted",
      "account_activated",
      "account_deactivated",
      "role_changed",
      "password_reset_requested",
    ],
  },
  {
    label: "權限操作",
    types: ["role_created", "role_updated", "role_deleted", "permission_changed"],
  },
  {
    label: "球隊操作",
    types: ["team_created", "team_updated", "team_deleted"],
  },
  {
    label: "學員操作",
    types: ["student_created", "student_updated", "student_deleted"],
  },
  {
    label: "課程操作",
    types: ["course_created", "course_updated", "course_deleted"],
  },
  {
    label: "登入登出",
    types: ["login_success", "logout"],
  },
];

// Get badge variant based on action type
const getActionBadgeVariant = (actionType: AuditActionType): "default" | "secondary" | "destructive" | "outline" => {
  if (actionType.includes("deleted")) return "destructive";
  if (actionType.includes("created")) return "default";
  if (actionType.includes("updated") || actionType.includes("changed")) return "secondary";
  return "outline";
};

const AuditLogs = () => {
  const { logs, isLoading, error } = useAuditLogs({ limit: 500 });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActionGroup, setSelectedActionGroup] = useState<string>("all");
  const [selectedTargetType, setSelectedTargetType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        log.user_name.toLowerCase().includes(searchLower) ||
        log.user_email.toLowerCase().includes(searchLower) ||
        (log.target_name && log.target_name.toLowerCase().includes(searchLower)) ||
        actionTypeLabels[log.action_type].toLowerCase().includes(searchLower);

      // Action group filter
      let matchesActionGroup = true;
      if (selectedActionGroup !== "all") {
        const group = actionTypeGroups.find((g) => g.label === selectedActionGroup);
        matchesActionGroup = group ? group.types.includes(log.action_type) : true;
      }

      // Target type filter
      const matchesTargetType =
        selectedTargetType === "all" || log.target_type === selectedTargetType;

      return matchesSearch && matchesActionGroup && matchesTargetType;
    });
  }, [logs, searchQuery, selectedActionGroup, selectedTargetType]);

  // Paginate
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedActionGroup("all");
    setSelectedTargetType("all");
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchQuery || selectedActionGroup !== "all" || selectedTargetType !== "all";

  // Format details for display
  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return null;
    return Object.entries(details).map(([key, value]) => ({
      key,
      label: getDetailLabel(key),
      value: formatDetailValue(value),
    }));
  };

  const getDetailLabel = (key: string): string => {
    const labelMap: Record<string, string> = {
      email: "Email",
      roleId: "角色 ID",
      roleName: "角色名稱",
      teamId: "球隊 ID",
      teamName: "球隊名稱",
      category: "分類",
      actionCount: "動作數量",
      oldRole: "原角色",
      newRole: "新角色",
      reason: "原因",
      ip: "IP 位址",
      userAgent: "瀏覽器",
    };
    return labelMap[key] || key;
  };

  const formatDetailValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <AppLayout title="操作日誌">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <PageBreadcrumb
          items={[
            { label: "帳號管理", path: "/accounts" },
            { label: "操作日誌" },
          ]}
        />

        <div className="bg-card rounded-lg border border-border">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium text-foreground">操作日誌</h2>
            <span className="text-sm text-muted-foreground">
              （共 {filteredLogs.length} 筆記錄）
            </span>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-border space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋操作者、目標名稱..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilterChange();
                }}
                className="pl-9"
              />
            </div>

            {/* Filter dropdowns */}
            <div className="flex flex-wrap gap-3">
              <Select
                value={selectedActionGroup}
                onValueChange={(value) => {
                  setSelectedActionGroup(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="操作類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  {actionTypeGroups.map((group) => (
                    <SelectItem key={group.label} value={group.label}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedTargetType}
                onValueChange={(value) => {
                  setSelectedTargetType(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="目標類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部目標</SelectItem>
                  {Object.entries(targetTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="w-4 h-4" />
                  清除篩選
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">{error}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {hasActiveFilters ? "沒有符合條件的記錄" : "目前沒有操作記錄"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">時間</TableHead>
                    <TableHead className="w-[120px]">操作者</TableHead>
                    <TableHead className="w-[140px]">操作類型</TableHead>
                    <TableHead className="w-[80px]">目標類型</TableHead>
                    <TableHead>目標名稱</TableHead>
                    <TableHead className="w-[200px]">詳情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "yyyy/MM/dd HH:mm", { locale: zhTW })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{log.user_name}</div>
                        <div className="text-xs text-muted-foreground">{log.user_email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action_type)}>
                          {actionTypeLabels[log.action_type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.target_type ? targetTypeLabels[log.target_type] || log.target_type : "-"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {log.target_name || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <TablePagination
                  currentPage={currentPage}
                  totalItems={filteredLogs.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              操作詳情
              {selectedLog && (
                <Badge variant={getActionBadgeVariant(selectedLog.action_type)}>
                  {actionTypeLabels[selectedLog.action_type]}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              {/* Time */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">操作時間</span>
                <span className="col-span-2 font-medium">
                  {format(new Date(selectedLog.created_at), "yyyy/MM/dd HH:mm:ss", { locale: zhTW })}
                </span>
              </div>

              {/* Operator */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-muted-foreground">操作者</span>
                <div className="col-span-2">
                  <div className="font-medium">{selectedLog.user_name}</div>
                  <div className="text-xs text-muted-foreground">{selectedLog.user_email}</div>
                </div>
              </div>

              {/* Target Type */}
              {selectedLog.target_type && (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground">目標類型</span>
                  <span className="col-span-2 font-medium">
                    {targetTypeLabels[selectedLog.target_type] || selectedLog.target_type}
                  </span>
                </div>
              )}

              {/* Target Name */}
              {selectedLog.target_name && (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground">目標名稱</span>
                  <span className="col-span-2 font-medium">{selectedLog.target_name}</span>
                </div>
              )}

              {/* Target ID */}
              {selectedLog.target_id && (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-muted-foreground">目標 ID</span>
                  <span className="col-span-2 font-mono text-xs text-muted-foreground">
                    {selectedLog.target_id}
                  </span>
                </div>
              )}

              {/* Details */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="pt-3 border-t border-border">
                  <div className="text-sm font-medium mb-3">詳細資訊</div>
                  <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                    {formatDetails(selectedLog.details as Record<string, unknown>)?.map(({ key, label, value }) => (
                      <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="col-span-2 break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AuditLogs;

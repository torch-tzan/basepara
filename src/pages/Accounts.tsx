import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TabNav, TabNavItem } from "@/components/ui/tab-nav";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronRight, Search, X, History } from "lucide-react";
import { useAccounts } from "@/contexts/AccountsContext";
import { usePermissions } from "@/hooks/usePermissions";

const accountTabs = ["帳號管理", "角色權限管理"];

const Accounts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl === "roles" ? "角色權限管理" : "帳號管理");
  
  const { 
    accounts, 
    toggleAccountActive, 
    roles, 
    getRoleName, 
    getAccountCountByRole,
    isLastAdmin
  } = useAccounts();
  
  const { permissions } = usePermissions();
  const canEdit = permissions.accounts.canEdit;

  // Search and filter state for accounts
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Search state for roles
  const [rolesSearchQuery, setRolesSearchQuery] = useState("");

  // Pagination state for accounts
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsPerPage, setAccountsPerPage] = useState(10);

  // Pagination state for roles
  const [rolesPage, setRolesPage] = useState(1);
  const [rolesPerPage, setRolesPerPage] = useState(10);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    let result = accounts;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (account) =>
          account.name.toLowerCase().includes(query) ||
          account.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      result = result.filter((account) => account.roleId === roleFilter);
    }

    // Active status filter
    if (activeFilter !== "all") {
      const isActive = activeFilter === "active";
      result = result.filter((account) => account.active === isActive);
    }

    return result;
  }, [accounts, searchQuery, roleFilter, activeFilter]);

  // Paginated accounts
  const paginatedAccounts = useMemo(() => {
    const startIndex = (accountsPage - 1) * accountsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + accountsPerPage);
  }, [filteredAccounts, accountsPage, accountsPerPage]);

  // Filtered roles
  const filteredRoles = useMemo(() => {
    if (!rolesSearchQuery) return roles;
    const query = rolesSearchQuery.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.description.toLowerCase().includes(query)
    );
  }, [roles, rolesSearchQuery]);

  // Paginated roles
  const paginatedRoles = useMemo(() => {
    const startIndex = (rolesPage - 1) * rolesPerPage;
    return filteredRoles.slice(startIndex, startIndex + rolesPerPage);
  }, [filteredRoles, rolesPage, rolesPerPage]);

  // Reset roles page when search changes
  useEffect(() => {
    setRolesPage(1);
  }, [rolesSearchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setAccountsPage(1);
  }, [searchQuery, roleFilter, activeFilter]);

  useEffect(() => {
    if (tabFromUrl === "roles") {
      setActiveTab("角色權限管理");
    }
  }, [tabFromUrl]);

  return (
    <AppLayout title="帳號管理">
      <div className="bg-card rounded-lg border border-border">
        {/* Tabs Header */}
        <div className="border-b border-border">
          <div className="flex justify-between items-center px-6">
            <TabNav className="space-x-8">
              {accountTabs.map((tab) => (
                <TabNavItem
                  key={tab}
                  active={activeTab === tab}
                  variant="underline"
                  onClick={() => setActiveTab(tab)}
                  className="py-4 px-2"
                >
                  {tab}
                </TabNavItem>
              ))}
            </TabNav>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => navigate("/accounts/audit-logs")}
              >
                <History className="w-4 h-4" />
                操作日誌
              </Button>
              {canEdit && (
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (activeTab === "角色權限管理") {
                      navigate("/accounts/roles/new");
                    } else {
                      navigate("/accounts/add");
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                  {activeTab === "帳號管理" ? "新增帳號" : "新增角色"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === "帳號管理" ? (
            /* Accounts Table */
            <>
              {/* Search and Filters */}
              <div className="p-6 pb-4 space-y-4">
                {/* Search Bar - 50% width, own row */}
                <div className="relative w-1/2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜尋姓名或 Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filters row - each 25% width */}
                <div className="flex items-center gap-4">
                  {/* Role filter - 25% width */}
                  <div className="w-1/4">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="全部角色" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部角色</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active status filter - 25% width */}
                  <div className="w-1/4">
                    <Select value={activeFilter} onValueChange={setActiveFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="全部狀態" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部狀態</SelectItem>
                        <SelectItem value="active">已啟用</SelectItem>
                        <SelectItem value="inactive">已停用</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear button - 25% width, only show when filters active */}
                  <div className="w-1/4">
                    {(searchQuery || roleFilter !== "all" || activeFilter !== "all") && (
                      <Button
                        variant="ghost"
                        className="h-10 px-4 text-muted-foreground hover:text-foreground w-full justify-start"
                        onClick={() => {
                          setSearchQuery("");
                          setRoleFilter("all");
                          setActiveFilter("all");
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        清除篩選
                      </Button>
                    )}
                  </div>

                  {/* Spacer - 25% width */}
                  <div className="w-1/4" />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>帳號姓名</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>啟用狀態</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAccounts.map((account) => (
                    <TableRow 
                      key={account.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/accounts/${account.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {account.name.charAt(0)}
                          </div>
                          <span className="text-foreground">{account.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {account.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getRoleName(account.roleId)}</Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={account.active}
                          onCheckedChange={() => toggleAccountActive(account.id)}
                          disabled={!canEdit || isLastAdmin(account.id)}
                          title={isLastAdmin(account.id) ? "無法停用最後一位管理員" : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={accountsPage}
                totalItems={filteredAccounts.length}
                itemsPerPage={accountsPerPage}
                onPageChange={setAccountsPage}
                onItemsPerPageChange={(val) => {
                  setAccountsPerPage(val);
                  setAccountsPage(1);
                }}
              />
            </>
          ) : (
            /* Roles List */
            <>
              {/* Search */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-4">
                  {/* Search Bar - 50% width */}
                  <div className="relative w-1/2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜尋角色名稱或說明..."
                      value={rolesSearchQuery}
                      onChange={(e) => setRolesSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {/* Clear button - 25% width */}
                  <div className="w-1/4">
                    {rolesSearchQuery && (
                      <Button
                        variant="ghost"
                        className="h-10 px-4 text-muted-foreground hover:text-foreground w-full justify-start"
                        onClick={() => setRolesSearchQuery("")}
                      >
                        <X className="w-4 h-4 mr-2" />
                        清除搜尋
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>角色名稱</TableHead>
                    <TableHead>說明</TableHead>
                    <TableHead className="text-center">使用人數</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRoles.map((role) => (
                    <TableRow 
                      key={role.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/accounts/roles/${role.id}`)}
                    >
                      <TableCell>
                        <span className="font-medium text-foreground">{role.name}</span>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {role.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{getAccountCountByRole(role.id)} 人</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={rolesPage}
                totalItems={filteredRoles.length}
                itemsPerPage={rolesPerPage}
                onPageChange={setRolesPage}
                onItemsPerPageChange={(val) => {
                  setRolesPerPage(val);
                  setRolesPage(1);
                }}
              />
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Accounts;

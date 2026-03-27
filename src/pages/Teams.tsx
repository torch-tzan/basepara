import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TablePagination } from "@/components/ui/table-pagination";
import { usePermissions } from "@/hooks/usePermissions";
import { useTeams } from "@/contexts/TeamsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { useDataAccess } from "@/hooks/useDataAccess";

const Teams = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const { permissions } = usePermissions();
  const { teams } = useTeams();
  const { accounts } = useAccounts();
  const { accessibleTeamIds, hasFullSiteAccess } = useDataAccess("teams");
  const canEdit = permissions.teams.canEdit;

  // Transform teams to include coach names from accounts, filtered by access
  const teamsWithCoaches = useMemo(() => {
    // Filter teams based on access permissions
    const accessibleTeams = hasFullSiteAccess 
      ? teams 
      : teams.filter((team) => accessibleTeamIds.includes(team.id));
    
    return accessibleTeams.map((team) => {
      const coachNames = team.coachIds
        .map((id) => accounts.find((acc) => acc.id === id)?.name)
        .filter(Boolean) as string[];
      return {
        id: team.id,
        name: team.name,
        level: team.level,
        attribute: team.attribute,
        coaches: coachNames,
      };
    });
  }, [teams, accounts, accessibleTeamIds, hasFullSiteAccess]);

  const filteredTeams = useMemo(() => {
    let result = teamsWithCoaches;
    
    // Filter by search query
    if (searchQuery) {
      result = result.filter((team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by name
    if (sortOrder) {
      result = [...result].sort((a, b) => {
        const comparison = a.name.localeCompare(b.name, "zh-TW");
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }
    
    return result;
  }, [teamsWithCoaches, searchQuery, sortOrder]);

  // Toggle sort order
  const handleSortToggle = () => {
    setSortOrder((prev) => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
  };

  // Paginated teams
  const displayTeams = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTeams.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTeams, currentPage, itemsPerPage]);

  // Reset to first page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <AppLayout
      title="球隊管理"
      headerAction={
        canEdit ? (
          <Button className="gap-2" onClick={() => navigate("/teams/add")}>
            <Plus className="w-4 h-4" />
            新增球隊
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Search Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">搜尋球隊</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜尋球隊名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Teams List */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">
              {hasFullSiteAccess ? "全部球隊列表" : "負責球隊列表"}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              共 {filteredTeams.length} 支球隊
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button 
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={handleSortToggle}
                    >
                      球隊名稱
                      {sortOrder === null && <ArrowUpDown className="w-4 h-4 text-muted-foreground" />}
                      {sortOrder === "asc" && <ArrowUp className="w-4 h-4" />}
                      {sortOrder === "desc" && <ArrowDown className="w-4 h-4" />}
                    </button>
                  </TableHead>
                  <TableHead>層級</TableHead>
                  <TableHead>屬性</TableHead>
                  <TableHead>球隊教練</TableHead>
                  <TableHead className="text-center">快速操作</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTeams.map((team) => (
                  <TableRow 
                    key={team.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/teams/${team.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">{team.name}</TableCell>
                    <TableCell className="text-muted-foreground">{team.level || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{team.attribute || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {team.coaches.map((coach, idx) => (
                          <Badge key={idx} variant="outline" className="font-normal text-xs">
                            {coach}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            title="編輯球隊"
                            onClick={() => navigate(`/teams/${team.id}/edit`)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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

            {/* Pagination */}
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredTeams.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Teams;

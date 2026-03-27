// ============= Accounts & Roles Mock Data =============

import { coachesConfig } from "./coachesConfig";
// Permission modules configuration
export const permissionModules = [
  { id: "home", name: "儀表板", description: "檢視系統總覽與統計資料", lockView: false, lockEdit: false, syncEditWithView: true, hidden: true },
  { id: "students", name: "學員資料管理", description: "管理學員資料與檔案", lockView: false, lockEdit: false, syncEditWithView: false, hidden: false },
  { id: "teams", name: "球隊管理", description: "管理球隊資料", lockView: false, lockEdit: false, syncEditWithView: false, hidden: false },
  { id: "schedule", name: "課表管理", description: "編輯與檢視訓練課表", lockView: false, lockEdit: false, syncEditWithView: false, hidden: false },
  { id: "reports", name: "檢測報告", description: "檢視與管理檢測報告", lockView: false, lockEdit: false, syncEditWithView: false, hidden: false },
  { id: "upload", name: "資料上傳", description: "上傳檢測資料", lockView: false, lockEdit: false, syncEditWithView: true, hidden: false },
  { id: "comparison", name: "層級比較", description: "檢視層級比較資料", lockView: false, lockEdit: false, syncEditWithView: true, hidden: false },
  { id: "templates", name: "範本管理", description: "管理訓練範本", lockView: false, lockEdit: false, syncEditWithView: false, hidden: false },
  { id: "accounts", name: "帳號管理", description: "管理系統帳號與權限", lockView: false, lockEdit: false, syncEditWithView: false, hidden: false },
] as const;

export type PermissionModuleId = typeof permissionModules[number]["id"];

// Permission type for each module
export interface ModulePermission {
  view: boolean;
  edit: boolean;
  fullSite: boolean;
}

// Role interface
export interface RoleData {
  id: string;
  name: string;
  description: string;
  permissions: Record<PermissionModuleId, ModulePermission>;
  isSystem?: boolean; // System roles cannot be deleted
}

// Default permissions (all false except locked ones)
export const createDefaultPermissions = (): Record<PermissionModuleId, ModulePermission> => {
  const permissions: Record<string, ModulePermission> = {};
  permissionModules.forEach((module) => {
    permissions[module.id] = {
      view: module.lockView,
      edit: module.lockEdit,
      fullSite: false,
    };
  });
  return permissions as Record<PermissionModuleId, ModulePermission>;
};

// Roles mock data
export const rolesData: RoleData[] = [
  {
    id: "admin",
    name: "Admin",
    description: "系統管理員，擁有所有權限",
    isSystem: true,
    permissions: {
      home: { view: true, edit: true, fullSite: true },
      students: { view: true, edit: true, fullSite: true },
      teams: { view: true, edit: true, fullSite: true },
      schedule: { view: true, edit: true, fullSite: true },
      reports: { view: true, edit: true, fullSite: true },
      upload: { view: true, edit: true, fullSite: true },
      comparison: { view: true, edit: true, fullSite: true },
      accounts: { view: true, edit: true, fullSite: true },
      templates: { view: true, edit: true, fullSite: true },
    },
  },
  {
    id: "venue_coach",
    name: "場館教練",
    description: "負責場館內所有學員的訓練與管理",
    isSystem: false,
    permissions: {
      home: { view: true, edit: true, fullSite: true },
      students: { view: true, edit: true, fullSite: true },
      teams: { view: true, edit: true, fullSite: true },
      schedule: { view: true, edit: true, fullSite: true },
      reports: { view: true, edit: true, fullSite: true },
      upload: { view: true, edit: true, fullSite: true },
      comparison: { view: true, edit: true, fullSite: true },
      accounts: { view: false, edit: false, fullSite: false },
      templates: { view: true, edit: true, fullSite: true },
    },
  },
  {
    id: "team_coach",
    name: "球隊教練",
    description: "負責特定球隊學員的訓練",
    isSystem: false,
    permissions: {
      home: { view: true, edit: true, fullSite: false },
      students: { view: true, edit: false, fullSite: false },
      teams: { view: true, edit: false, fullSite: false },
      schedule: { view: true, edit: false, fullSite: false },
      reports: { view: true, edit: false, fullSite: false },
      upload: { view: false, edit: false, fullSite: false },
      comparison: { view: false, edit: false, fullSite: false },
      accounts: { view: false, edit: false, fullSite: false },
      templates: { view: false, edit: false, fullSite: false },
    },
  },
];

// Account interface
export interface AccountData {
  id: string;
  name: string;
  email: string;
  roleId: string;
  active: boolean;
  createdAt: string;
  teams?: string[]; // Team IDs this coach is responsible for
}

// Accounts mock data
export const accountsData: AccountData[] = [
  {
    id: "acc1",
    name: "Admin",
    email: "admin@email.com",
    roleId: "admin",
    active: true,
    createdAt: "2024/01/01",
  },
  {
    id: "acc2",
    name: "李志明",
    email: "li.coach@example.com",
    roleId: "venue_coach",
    active: true,
    createdAt: "2024/02/15",
  },
  {
    id: "acc3",
    name: "王建國",
    email: "wang.coach@example.com",
    roleId: "team_coach",
    active: false,
    createdAt: "2024/03/10",
  },
  {
    id: "acc4",
    name: "張美玲",
    email: "zhang.coach@example.com",
    roleId: "team_coach",
    active: true,
    createdAt: "2024/04/20",
  },
  {
    id: "acc5",
    name: "劉大偉",
    email: "liu.coach@example.com",
    roleId: "venue_coach",
    active: true,
    createdAt: "2024/05/05",
  },
  // Coaches from shared config - auto-generated from coachesConfig
  ...coachesConfig.map((coach) => ({
    id: coach.id,
    name: coach.name,
    email: coach.email,
    roleId: coach.roleId,
    active: true,
    createdAt: "2024/01/15",
    teams: coach.teams,
  })),
];

// ============= Helper Functions =============

// Get role by ID
export const getRoleById = (id: string): RoleData | undefined => {
  return rolesData.find((r) => r.id === id);
};

// Get account by ID
export const getAccountById = (id: string): AccountData | undefined => {
  return accountsData.find((a) => a.id === id);
};

// Get role name by ID
export const getRoleName = (roleId: string): string => {
  const role = getRoleById(roleId);
  return role?.name || "未知角色";
};

// Count accounts by role
export const getAccountCountByRole = (roleId: string): number => {
  return accountsData.filter((a) => a.roleId === roleId).length;
};

// Get role options for select dropdown
export const getRoleOptions = () => {
  return rolesData.map((r) => ({ value: r.id, label: r.name }));
};

// Generate unique ID
export const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get coaches by team ID
export const getCoachesByTeam = (teamId: string): AccountData[] => {
  return accountsData.filter((a) => a.teams?.includes(teamId) && a.active);
};

// Get all coaches (accounts with team assignments)
export const getAllCoaches = (): AccountData[] => {
  return accountsData.filter((a) => a.teams && a.teams.length > 0 && a.active);
};

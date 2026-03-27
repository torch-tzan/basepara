// User authentication and session management context
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { accountsData, getRoleById } from "@/data/accountsData";
import { studentsConfig } from "@/data/studentsConfig";
import { teamsConfig } from "@/data/teamsConfig";

// Default password for all users
const DEFAULT_PASSWORD = "000000";

export type UserRole = "admin" | "venue_coach" | "team_coach" | "student";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  teams?: string[]; // Team IDs
  teamNames?: string[]; // Team display names
  studentId?: string; // For student role, link to student data
}

// Student accounts derived from studentsConfig
const getStudentAccounts = () => {
  return studentsConfig.map((student) => ({
    id: `student_${student.id}`,
    name: student.name,
    email: student.email,
    role: "student" as UserRole,
    roleLabel: "學員",
    teams: student.teamId ? [student.teamId] : [],
    teamNames: student.teamId 
      ? [teamsConfig.find(t => t.id === student.teamId)?.name || ""] 
      : [],
    studentId: student.id,
  }));
};

// Convert account data to User format
const getAccountUsers = (): User[] => {
  return accountsData.map((account) => {
    const role = getRoleById(account.roleId);
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.roleId as UserRole,
      roleLabel: role?.name || account.roleId,
      teams: account.teams,
      teamNames: account.teams?.map(
        (teamId) => teamsConfig.find((t) => t.id === teamId)?.name || ""
      ),
    };
  });
};

// Get all users (accounts + students)
const getAllUsers = (): User[] => {
  return [...getAccountUsers(), ...getStudentAccounts()];
};

interface LoginResult {
  success: boolean;
  error?: string;
}

interface UserContextType {
  currentUser: User | null;
  login: (email: string, password: string) => LoginResult;
  logout: (navigate?: (path: string) => void) => void;
  switchUser: (userId: string, navigate?: (path: string) => void) => void;
  allUsers: User[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string): LoginResult => {
    // Check password first
    if (password !== DEFAULT_PASSWORD) {
      return { success: false, error: "帳號或密碼錯誤，請重新確認" };
    }

    // Find user by email
    const allUsers = getAllUsers();
    const user = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return { success: false, error: "帳號或密碼錯誤，請重新確認" };
    }

    // Check if account is active (for non-student accounts)
    const account = accountsData.find(
      (a) => a.email.toLowerCase() === email.toLowerCase()
    );
    if (account && !account.active) {
      return { success: false, error: "此帳號已停用，請聯繫管理員" };
    }

    setCurrentUser(user);
    return { success: true };
  }, []);

  const switchUser = useCallback((userId: string, navigate?: (path: string) => void) => {
    const allUsers = getAllUsers();
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (navigate) {
        navigate("/schedule");
      }
    }
  }, []);

  const logout = useCallback((navigate?: (path: string) => void) => {
    setCurrentUser(null);
    if (navigate) {
      navigate("/login");
    }
  }, []);

  const allUsers = getAllUsers();

  return (
    <UserContext.Provider value={{ currentUser, login, logout, switchUser, allUsers }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

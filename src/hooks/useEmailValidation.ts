import { useCallback } from "react";
import { useAccounts } from "@/contexts/AccountsContext";
import { useStudents } from "@/contexts/StudentsContext";

interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

interface EmailValidationOptions {
  excludeAccountId?: string;
  excludeStudentId?: string;
}

/**
 * Centralized email validation hook
 * Checks email format and uniqueness across accounts and students
 */
export const useEmailValidation = () => {
  const { accounts } = useAccounts();
  const { students } = useStudents();

  /**
   * Validate email format
   */
  const validateEmailFormat = useCallback((email: string): EmailValidationResult => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      return { isValid: false, error: "請輸入 Email" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { isValid: false, error: "請輸入有效的 Email 格式" };
    }

    if (trimmedEmail.length > 255) {
      return { isValid: false, error: "Email 不能超過 255 字" };
    }

    return { isValid: true };
  }, []);

  /**
   * Check if email is already used by another account or student
   */
  const checkEmailUniqueness = useCallback(
    (email: string, options: EmailValidationOptions = {}): EmailValidationResult => {
      const { excludeAccountId, excludeStudentId } = options;
      const emailLower = email.trim().toLowerCase();

      // Check accounts
      const accountEmailExists = accounts.some(
        (acc) => acc.email.toLowerCase() === emailLower && acc.id !== excludeAccountId
      );

      // Check students
      const studentEmailExists = students.some(
        (s) => s.email.toLowerCase() === emailLower && s.id !== excludeStudentId
      );

      if (accountEmailExists || studentEmailExists) {
        return { isValid: false, error: "此 Email 已被使用，請使用其他 Email" };
      }

      return { isValid: true };
    },
    [accounts, students]
  );

  /**
   * Full email validation (format + uniqueness)
   */
  const validateEmail = useCallback(
    (email: string, options: EmailValidationOptions = {}): EmailValidationResult => {
      // First check format
      const formatResult = validateEmailFormat(email);
      if (!formatResult.isValid) {
        return formatResult;
      }

      // Then check uniqueness
      return checkEmailUniqueness(email, options);
    },
    [validateEmailFormat, checkEmailUniqueness]
  );

  return {
    validateEmail,
    validateEmailFormat,
    checkEmailUniqueness,
  };
};

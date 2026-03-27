import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface MentionUser {
  id: string;
  name: string;
  type: "coach" | "student";
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: MentionUser[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MentionInput = ({
  value,
  onChange,
  users,
  placeholder = "輸入留言...",
  className,
  disabled,
}: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter users based on mention query
  const filteredUsers = useMemo(() => {
    if (!mentionQuery) return users.slice(0, 5);
    const query = mentionQuery.toLowerCase();
    return users
      .filter((u) => u.name.toLowerCase().includes(query))
      .slice(0, 5);
  }, [users, mentionQuery]);

  // Check for @ trigger
  const checkForMention = useCallback(
    (text: string, cursorPos: number) => {
      // Find the last @ before cursor
      let atIndex = -1;
      for (let i = cursorPos - 1; i >= 0; i--) {
        const char = text[i];
        if (char === "@") {
          atIndex = i;
          break;
        }
        // Stop if we hit a space before finding @
        if (char === " " || char === "\n") break;
      }

      if (atIndex >= 0) {
        const query = text.slice(atIndex + 1, cursorPos);
        // Only show if query doesn't contain spaces
        if (!query.includes(" ") && !query.includes("\n")) {
          setMentionStart(atIndex);
          setMentionQuery(query);
          setShowSuggestions(true);
          setSuggestionIndex(0);
          return;
        }
      }

      setShowSuggestions(false);
      setMentionStart(-1);
      setMentionQuery("");
    },
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;

    // Check for mention trigger
    const cursorPos = e.target.selectionStart;
    checkForMention(newValue, cursorPos);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSuggestionIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case "Enter":
        if (filteredUsers.length > 0) {
          e.preventDefault();
          selectUser(filteredUsers[suggestionIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case "Tab":
        if (filteredUsers.length > 0) {
          e.preventDefault();
          selectUser(filteredUsers[suggestionIndex]);
        }
        break;
    }
  };

  const selectUser = (user: MentionUser) => {
    if (mentionStart < 0) return;

    const before = value.slice(0, mentionStart);
    const after = value.slice(
      mentionStart + mentionQuery.length + 1 // +1 for @
    );
    const newValue = `${before}@${user.name} ${after}`;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(-1);
    setMentionQuery("");

    // Focus and set cursor after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = before.length + user.name.length + 2; // @ + name + space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => name.slice(0, 1);

  return (
    <div className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className={cn("resize-none overflow-hidden text-sm", className)}
        style={{ minHeight: "2.5rem" }}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-1">
            <div className="px-2 py-1 text-xs text-muted-foreground">
              標記用戶
            </div>
            {filteredUsers.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                onClick={() => selectUser(user)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                  idx === suggestionIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback
                    className={cn(
                      "text-[10px]",
                      user.type === "coach"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {user.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {user.type === "coach" ? "教練" : "學員"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hint text */}
    </div>
  );
};

// Helper function to parse mentions from text
export const parseMentions = (
  text: string,
  users: MentionUser[]
): { mentionedIds: string[]; mentionedNames: string[] } => {
  const mentionedIds: string[] = [];
  const mentionedNames: string[] = [];

  // Match @Name patterns
  const mentionRegex = /@([^\s@]+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionedName = match[1];
    const user = users.find(
      (u) => u.name === mentionedName || u.name.startsWith(mentionedName)
    );
    if (user && !mentionedIds.includes(user.id)) {
      mentionedIds.push(user.id);
      mentionedNames.push(user.name);
    }
  }

  return { mentionedIds, mentionedNames };
};

// Helper to render text with highlighted mentions
export const renderMentionText = (text: string): React.ReactNode => {
  const parts = text.split(/(@[^\s@]+)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("@")) {
      return (
        <span key={idx} className="text-primary font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
};

export default MentionInput;

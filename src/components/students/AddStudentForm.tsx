import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormDatePicker } from "@/components/ui/form-datepicker";
import { FormSelect } from "@/components/ui/form-select";
import { FormSelectMulti } from "@/components/ui/form-select-multi";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTeams } from "@/hooks/useSupabaseTeams";
import { useAccounts } from "@/hooks/useSupabaseAccounts";
import { useCreateStudentAccount } from "@/hooks/useCreateStudentAccount";
import { teamLevelOptions, countyOptions } from "@/data/teamsConfig";
import { Loader2 } from "lucide-react";


interface AddStudentFormProps {
  onSuccess: () => void;
}

const AddStudentForm = ({ onSuccess }: AddStudentFormProps) => {
  const { toast } = useToast();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const createStudentAccount = useCreateStudentAccount();

  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState<Date>();
  const [positionType, setPositionType] = useState("");
  const [team, setTeam] = useState("");
  const [level, setLevel] = useState("");
  const [county, setCounty] = useState("");
  const [selectedCoaches, setSelectedCoaches] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  // Filter accounts to get coaches (show all active accounts as potential coaches)
  const coaches = accounts.filter((account) => account.active !== false);

  // Get team coaches based on selected team
  const selectedTeamData = teams.find((t) => t.id === team);
  const teamCoachIds = selectedTeamData?.coachIds || [];

  // 切換球隊時：若使用者尚未指定層級/縣市，自動帶入該球隊的值
  const handleTeamChange = (newTeamId: string) => {
    setTeam(newTeamId);
    const t = teams.find((x) => x.id === newTeamId);
    if (!level && t?.level) {
      setLevel(t.level);
    }
    const teamCounty = t
      ? ((t as Record<string, unknown>).county as string | undefined)
      : undefined;
    if (!county && teamCounty) {
      setCounty(teamCounty);
    }
  };

  // Get coach name by id
  const getCoachName = (coachId: string) => {
    const coach = accounts.find((a) => a.id === coachId);
    return coach?.name || coachId;
  };

  const validateForm = () => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = "請填寫姓名";
    }

    if (!email.trim()) {
      newErrors.email = "請填寫信箱";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = "請輸入有效的信箱格式";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await createStudentAccount.mutateAsync({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        team_id: team || undefined,
        position: positionType || undefined,
        height: height || undefined,
        weight: weight || undefined,
        birthday: birthday ? birthday.toISOString().split("T")[0] : undefined,
        responsibleCoachIds: selectedCoaches.length > 0 ? selectedCoaches : undefined,
      });

      toast({
        title: "新增成功",
        description: `已成功新增學員：${name}，帳號已建立並發送密碼重設郵件`,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Create student error:", error);
      toast({
        title: "新增失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
    }
  };

  const isLoading = teamsLoading || accountsLoading;
  const isSubmitting = createStudentAccount.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 姓名 */}
      <FormField
        label="姓名"
        required
        placeholder="請輸入學員姓名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        disabled={isSubmitting}
      />

      {/* 身高體重 */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="身高 (cm)"
          type="number"
          placeholder="例如：175"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          disabled={isSubmitting}
        />
        <FormField
          label="體重 (kg)"
          type="number"
          placeholder="例如：68"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* 信箱 */}
      <FormField
        label="信箱"
        required
        type="email"
        placeholder="example@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        description={!errors.email ? "此信箱將作為學員的登入帳號" : undefined}
        disabled={isSubmitting}
      />

      {/* 生日 */}
      <FormDatePicker
        label="生日"
        value={birthday}
        onChange={setBirthday}
        placeholder="選擇生日"
        disabled={(date) => date > new Date() || date < new Date("1990-01-01")}
        showYearDropdown
        fromYear={1990}
        toYear={new Date().getFullYear()}
      />

      {/* 投打類型 */}
      <FormSelect
        label="投打類型"
        value={positionType}
        onValueChange={setPositionType}
        placeholder="選擇投打類型"
        options={[
          { value: "pitcher", label: "投手" },
          { value: "fielder", label: "野手" },
        ]}
        disabled={isSubmitting}
      />

      {/* 所屬球隊 */}
      <FormSelect
        label="所屬球隊"
        value={team}
        onValueChange={handleTeamChange}
        placeholder={isLoading ? "載入中..." : "選擇所屬球隊"}
        options={teams.map((t) => ({ value: t.id, label: t.name }))}
        disabled={isSubmitting || isLoading}
      />

      {/* 層級 + 縣市 (選球隊時自動帶入，可手動覆寫) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormSelect
          label="層級"
          value={level}
          onValueChange={setLevel}
          placeholder="選擇層級"
          options={teamLevelOptions}
          disabled={isSubmitting}
        />
        <FormSelect
          label="縣市"
          value={county}
          onValueChange={setCounty}
          placeholder="選擇縣市"
          options={countyOptions}
          description={team ? "選擇球隊時會自動帶入" : undefined}
          disabled={isSubmitting}
        />
      </div>

      {/* 球隊教練 (自動帶入) */}
      {team && teamCoachIds.length > 0 && (
        <div className="space-y-2">
          <Label>球隊教練</Label>
          <div className="flex flex-wrap gap-2 p-3 bg-accent/50 rounded-md border border-border">
            {teamCoachIds.map((coachId) => (
              <span
                key={coachId}
                className="inline-flex items-center px-2.5 py-1 rounded-md bg-background text-sm text-foreground border border-border"
              >
                {getCoachName(coachId)}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            自動帶入所屬球隊的教練
          </p>
        </div>
      )}

      {/* 負責教練 */}
      <FormSelectMulti
        label="負責教練"
        values={selectedCoaches}
        onChange={setSelectedCoaches}
        options={coaches.map((c) => ({ value: c.id, label: c.name }))}
        placeholder={isLoading ? "載入中..." : "選擇教練"}
        maxItems={3}
        addButtonText="新增教練"
        description="手動選擇 1~3 位負責教練（選填）"
        disabled={isSubmitting || isLoading}
      />

      {/* 按鈕 */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              建立中...
            </>
          ) : (
            "確認新增"
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddStudentForm;

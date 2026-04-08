import { useState, useEffect } from "react";
import type { MechanicsItem } from "./MechanicsChecklist";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MechanicsExplanationProps {
  /** 需要說明的機制項目（有進步空間的項目） */
  items: MechanicsItem[];
  /** 個人化建議（語音轉文字或教練手動輸入） */
  personalAdvice?: string;
}

/**
 * 罐頭文字庫 — 每個機制可能有 1~3 種罐頭文字
 * 教練可切換不同版本並進一步編輯
 */
const cannedTexts: Record<string, string[]> = {
  TorsoOverCoil: [
    "軀幹代償背轉表示在蓄力階段，軀幹旋轉幅度過大以補償髖部旋轉不足。建議透過髖內旋訓練改善下半身啟動效率，避免上半身過度代償。",
    "選手在蓄力時上半身轉動過度，容易導致揮棒節奏失衡。可透過下肢旋轉啟動訓練來改善。",
    "過度的軀幹背轉會延長揮棒時間並降低效率。建議加強核心穩定與髖啟動訓練。",
  ],
  LeadLegRetraction: [
    "前腳回拉不足會影響重心轉移效率。建議加強前腳踩地後的制動訓練，增加穩定性與力量傳遞。",
    "前腳制動不夠積極會使力量無法有效傳遞至上肢。可透過彈力帶阻力訓練強化。",
    "前腳回拉是高階打擊動作的關鍵。建議觀察職業選手的前腳處理方式並模仿學習。",
  ],
  CatapultLoading: [
    "二階段蓄力表示揮棒過程中出現二次蓄力現象，影響揮棒節奏與效率。建議簡化蓄力動作，強調一次性的流暢蓄力。",
    "多餘的蓄力動作會延長反應時間。可透過節拍訓練器強化揮棒的節奏感。",
    "建議改用更簡潔的蓄力方式，從靜態姿勢直接進入揮擊動作。",
  ],
  SwingPlane: [
    "揮擊平面偏離理想軌跡，可能影響擊球一致性。建議透過 T 座練習修正揮棒路徑，確保球棒在擊球區維持正確平面。",
    "揮棒平面不穩定會造成擊球點差異過大。可在揮棒軌跡線下方放置參考線進行視覺訓練。",
    "使用慢動作鏡頭分析揮棒平面能更精準地找出偏差並修正。",
  ],
  LeadLegRatateEarly: [
    "過早拉動骨盆旋轉會導致上下半身分離時機不佳，影響球速輸出。建議強化跨步階段的下半身穩定性訓練。",
    "骨盆啟動時機過早會使手臂失去蓄力空間。可透過分解動作練習改善時序。",
    "建議在訓練時使用節拍器，延後骨盆啟動的時間點。",
  ],
  Stacking: [
    "核心脫離中立位表示軀幹在投球過程中未能維持穩定的層疊結構。建議加強核心穩定性訓練，特別是側向穩定能力。",
    "軀幹層疊不佳會增加肩肘負擔。建議加入平板支撐與死蟲式等核心訓練。",
    "可透過鏡子前的靜態投球姿勢檢查，找到中立位的感覺。",
  ],
  HHS_Early_SP: [
    "矢狀面肩髖分離時間點過早，可能導致手臂尚未就位就開始旋轉。建議透過藥球訓練改善時序控制。",
    "肩髖分離過早會影響球速與控球。可透過分解動作練習來修正時序。",
    "建議觀看自己的投球慢動作並與標準動作對比，找出時間差異。",
  ],
  ScapLoad: [
    "投球手蓄力不足影響手臂加速的能力。建議加強肩胛骨穩定訓練及投擲動作中的手臂後拉練習。",
    "肩胛蓄力不足會使揮臂速度受限。可透過彈力帶牽拉訓練改善。",
    "建議加入肩胛穩定訓練與手臂路徑訓練。",
  ],
  SecondArmSpiral: [
    "缺乏二段螺旋手臂動作會影響球速及旋轉效率。建議透過長拋練習強化手臂的延遲螺旋動作。",
    "二段螺旋是高階投手的關鍵動作。可透過慢動作觀察職業投手並模仿。",
    "建議從站立投擲開始練習手臂螺旋路徑，逐步加入下肢動作。",
  ],
};

interface ExplanationState {
  /** 當前選擇的罐頭文字 index */
  selectedIdx: number;
  /** 使用者編輯後的文字（若未編輯則為 null） */
  editedText: string | null;
  /** 是否處於編輯模式 */
  isEditing: boolean;
  /** 編輯中的 draft */
  draft: string;
}

const MechanicsExplanation = ({ items, personalAdvice }: MechanicsExplanationProps) => {
  const needsExplanation = items.filter((item) => !item.isGood);

  // 為每個需要說明的機制維護狀態
  const [states, setStates] = useState<Record<string, ExplanationState>>({});

  // 當 items 變更時同步 state
  useEffect(() => {
    setStates((prev) => {
      const next = { ...prev };
      needsExplanation.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = { selectedIdx: 0, editedText: null, isEditing: false, draft: "" };
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsExplanation.length]);

  const getCurrentText = (itemId: string): string => {
    const state = states[itemId];
    if (!state) return cannedTexts[itemId]?.[0] || "說明文字待補充。";
    if (state.editedText !== null) return state.editedText;
    return cannedTexts[itemId]?.[state.selectedIdx] || "說明文字待補充。";
  };

  const handleSelectCanned = (itemId: string, idx: number) => {
    setStates((prev) => ({
      ...prev,
      [itemId]: {
        selectedIdx: idx,
        editedText: null, // 切換罐頭時清除編輯
        isEditing: false,
        draft: "",
      },
    }));
  };

  const startEdit = (itemId: string) => {
    setStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isEditing: true,
        draft: getCurrentText(itemId),
      },
    }));
  };

  const saveEdit = (itemId: string) => {
    setStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        editedText: prev[itemId].draft,
        isEditing: false,
      },
    }));
  };

  const cancelEdit = (itemId: string) => {
    setStates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isEditing: false,
        draft: "",
      },
    }));
  };

  const updateDraft = (itemId: string, draft: string) => {
    setStates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], draft },
    }));
  };

  if (needsExplanation.length === 0 && !personalAdvice) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-foreground">機制說明</h3>

      {needsExplanation.map((item) => {
        const state = states[item.id];
        const cannedOptions = cannedTexts[item.id] || [];
        const hasMultipleCanned = cannedOptions.length > 1;
        const isEdited = state?.editedText !== null && state?.editedText !== undefined;

        return (
          <div key={item.id} className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
                {item.label}
              </h4>
              <div className="flex items-center gap-1 print:hidden">
                {isEdited && (
                  <span className="text-[10px] text-muted-foreground italic mr-1">已編輯</span>
                )}
                {/* 罐頭切換 */}
                {hasMultipleCanned && !state?.isEditing && (
                  <div className="flex items-center gap-0.5">
                    {cannedOptions.map((_, idx) => (
                      <Button
                        key={idx}
                        variant={state?.selectedIdx === idx && !isEdited ? "default" : "outline"}
                        size="icon"
                        className="h-6 w-6 text-[10px]"
                        onClick={() => handleSelectCanned(item.id, idx)}
                      >
                        {idx + 1}
                      </Button>
                    ))}
                  </div>
                )}
                {/* 編輯/儲存/取消 */}
                {!state?.isEditing ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => startEdit(item.id)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-600 hover:text-green-700"
                      onClick={() => saveEdit(item.id)}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => cancelEdit(item.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {state?.isEditing ? (
              <Textarea
                value={state.draft}
                onChange={(e) => updateDraft(item.id, e.target.value)}
                className="text-sm min-h-[80px] resize-none"
                autoFocus
              />
            ) : (
              <p className={cn("text-sm text-foreground/80 leading-relaxed")}>
                {getCurrentText(item.id)}
              </p>
            )}
          </div>
        );
      })}

      {personalAdvice && (
        <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
          <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
            個人化建議
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {personalAdvice}
          </p>
        </div>
      )}
    </div>
  );
};

export default MechanicsExplanation;

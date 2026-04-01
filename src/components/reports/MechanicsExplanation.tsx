import type { MechanicsItem } from "./MechanicsChecklist";

interface MechanicsExplanationProps {
  /** 需要說明的機制項目（有進步空間的項目） */
  items: MechanicsItem[];
  /** 個人化建議 */
  personalAdvice?: string;
}

// 罐頭文字 map（demo 用）
const cannedText: Record<string, string> = {
  TorsoOverCoil: "軀幹代償背轉表示在蓄力階段，軀幹旋轉幅度過大以補償髖部旋轉不足。建議透過髖內旋訓練改善下半身啟動效率，避免上半身過度代償。",
  LeadLegRetraction: "前腳回拉不足會影響重心轉移效率。建議加強前腳踩地後的制動訓練，增加穩定性與力量傳遞。",
  CatapultLoading: "二階段蓄力表示揮棒過程中出現二次蓄力現象，影響揮棒節奏與效率。建議簡化蓄力動作，強調一次性的流暢蓄力。",
  SwingPlane: "揮擊平面偏離理想軌跡，可能影響擊球一致性。建議透過 T 座練習修正揮棒路徑，確保球棒在擊球區維持正確平面。",
  LeadLegRatateEarly: "過早拉動骨盆旋轉會導致上下半身分離時機不佳，影響球速輸出。建議強化跨步階段的下半身穩定性訓練。",
  Stacking: "核心脫離中立位表示軀幹在投球過程中未能維持穩定的層疊結構。建議加強核心穩定性訓練，特別是側向穩定能力。",
  HHS_Early_SP: "矢狀面肩髖分離時間點過早，可能導致手臂尚未就位就開始旋轉。建議透過藥球訓練改善時序控制。",
  ScapLoad: "投球手蓄力不足影響手臂加速的能力。建議加強肩胛骨穩定訓練及投擲動作中的手臂後拉練習。",
  SecondArmSpiral: "缺乏二段螺旋手臂動作會影響球速及旋轉效率。建議透過長拋練習強化手臂的延遲螺旋動作。",
};

const MechanicsExplanation = ({ items, personalAdvice }: MechanicsExplanationProps) => {
  const needsExplanation = items.filter((item) => !item.isGood);

  if (needsExplanation.length === 0 && !personalAdvice) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-foreground">機制說明</h3>

      {needsExplanation.map((item) => (
        <div key={item.id} className="bg-muted/30 rounded-lg p-4 border border-border/50">
          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
            {item.label}
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {cannedText[item.id] || "說明文字待補充。"}
          </p>
        </div>
      ))}

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

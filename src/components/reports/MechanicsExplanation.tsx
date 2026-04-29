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
  /** 純檢視模式：隱藏罐頭切換按鈕與編輯 icon */
  readOnly?: boolean;
  /** 教練回覆的變更 callback；有提供且非 readOnly 時會顯示為可點擊編輯的 Textarea */
  onPersonalAdviceChange?: (value: string) => void;
}

/**
 * 罐頭文字庫 — 來源：AICoach檢測報告說明文字.xlsx
 * 每個查核點有 1~3 種罐頭文字，序次 1 為預設、2 為順位二、3 為順位三。
 * 教練可切換不同版本，或點編輯手動輸入。
 * 沒有罐頭文字的查核點（如 GloveArmPulling）→ 教練只能手動輸入。
 */
const cannedTexts: Record<string, string[]> = {
  // ── 打擊機制（Batting）──
  HipCoil: [
    "蓄力方式下蹲過多，容易導致跨步過程中重心出現上下移動，影響擊球穩定性",
    "無髖內旋蓄力，容易導致後續旋轉加速空間不足",
    "髖內旋蓄力過多，容易導致難以跟上高球速投手的正確 Timing",
  ],
  TorsoOverCoil: [
    "蓄力期以手部後拉蓄力為主，違背近遠端原則，容易出現後續打擊動作時序錯誤",
    "蓄力期以軀幹背轉蓄力為主，容易過早出現肩髖分離角度，影響後續打擊動作時序",
  ],
  HipHinge_Hitting: [
    "蓄力時軀幹過度直立，建議稍微增加髖屈幅度，有助於提高後續擊球的可調整性",
    "蓄力時有不錯的髖屈角度，但在跨步過程中過早失去髖屈角度，導致可以攻擊的來球範圍受限，尤其不好攻擊內角或是低角度位置來球",
  ],
  RotateAxis: [
    "過度依賴手部來攻擊不同位置球，應訓練以軀幹進行初步調整",
  ],
  RearFootTwist: [
    "由於蓄力時下蹲比例過高，導致後腳傾向使用推蹬方式出力，建議改為外扭方式",
    "後腳過早出現內旋狀態，建議採外扭方式，可提高揮棒速度",
  ],
  LeadLegRetraction: [
    "揮棒過程重心上移，容易導致擊球品質下降，建議練習前腳回拉模式，能有效提高重心一致性",
    "前腳等長收縮不足，重心過早移動至腳掌外側，失去穩固加速地基",
  ],
  ArmDragging: [
    "揮棒時，球棒過度拖在身體之後，容易導致揮棒軌跡過長、揮擊時間過長",
    "揮棒時，手部於軀幹旋轉初期遠離旋轉軸心，容易導致揮棒軌跡過長、揮擊時間過長",
  ],
  SwingExtension: [
    "球棒行進軌跡與球進壘平面重和時間少，無完整延伸，導致擊球容錯率低",
  ],
  CatapultLoading: [
    "由於揮擊時間過長，建議暫時減少跨步期後期手部後拉幅度，能有效提高揮擊準確性",
    "手部啟動時間過早，建議加入跨步期後期「手部向後蓄力」意圖，改善動作時序",
  ],
  LinearMove: [
    "蓄力期重心後移幅度過大，容易導致後腳穩定性下降",
    "前腳無法形成穩定旋轉支點，導致重心持續前衝，無法有效煞車",
    "重心向前移動幅度不足，無法有效創造線性能量，初始能量不足情況下，難以創造高的旋轉爆發力",
  ],
  HipShoulderSeperation_Hitting: [
    "軀幹延展狀態肌力不足，因此即便髖旋轉時機正確，軀幹仍過早啟動",
    "分離過大＋軀幹旋轉爆發力不足，導致肩髖分離產生後，無法在擊球前有效彌合\n建議暫時縮小分離幅度並同時訓練軀幹旋轉爆發力",
  ],
  LeadLegStep: [
    "踩位過度關閉，限縮旋轉空間",
    "踩位過度開放，容易導致旋轉過頭或無法有效產生反方向擊球",
  ],
  SwingPlane: [
    "攻擊角度過低，無法重和來球平面，造成有效擊球率降低",
    "攻擊角度過高，無法重和來球平面，造成有效擊球率降低",
  ],
  ProximalDeceleration: [
    "擊球前，髖尚未完整煞車（旋轉過頭），容易出現過度旋轉",
    "擊球前，軀幹尚未完整煞車（旋轉過頭），容易出現過度旋轉",
  ],

  // ── 投球機制（Pitching）──
  Drift: [
    "指投手在抬腿達到最高點（平衡點）時，重心主動向目標方向移動的線性過程。未做出飄移，會導致動力鏈的啟動效率低下。下肢的運動應以產生線性力為主要目標，將重心的移動視為投球的起點而非單純下蹲",
  ],
  KneeValgus: [
    "跨步期後腳（軸心腳）出現膝蓋內翻或不穩定的晃動，是後腳錨定失效與肌肉募集順序錯誤。徵兆為將重量放在後腳的內側。這會導致後膝過早向內潰縮，進而削弱創造髖屈曲的能力\n落下時應感覺後腳在扭開地板，透過後腳錨定儘可能延長與地面的接觸，為重心移動創造更多時間",
    "落下時將重心移向腳尖，股四頭肌會過度接管動作，而負責穩定髖部的臀中肌與臀小肌會隨之「關閉」。這會導致臀部縮到脊椎下方，膝蓋向前衝過腳趾，形成不穩定的連鎖反應\n建議在落下的過程中，屁股重心維持在腳掌正中間，確保進行「髖鉸鏈」而非單純的下蹲",
  ],
  PushRubber: [
    "在落下時過早出現髖伸產生側向主動推蹬，會擾亂下肢的線性動量與旋轉時序，使身體無法在觸地瞬間產生足夠的轉矩來引導骨盆開啟，導致旋轉「卡住」，後腳無法進入理想的髖部鎖定狀態。\n建議將意識從「推蹬」轉向「向下錨定」後快速進到髖部鎖定的狀態。",
  ],
  HipHinge_Pitching: [
    "「落下」與「髖鉸鏈」是下肢產生線性動量的核心關鍵。若在跨步期未能做出這些動作，通常會導致能量累積不足，並迫使身體依賴手臂代償。",
  ],
  LeadLegRatateEarly: [
    "落下時前腳過早解鎖由前腳帶動骨盆旋轉，而非由軸心腳透過髖鉸鏈支撐做出閉鎖式髖外旋進入髖部鎖定的狀態",
  ],
  ClosedStep: [
    "前導腳觸地時，踩在後腳跟到本壘板連線的關閉側（右投：左腳掌踩在該線右側；左投：右腳掌踩在該線左側），可能促使骨盆無法面向本壘板，使上半身必須跨過前腳進行投球。\n建議改善腳掌踩位到該連線上方。",
  ],
  OpenStep: [
    "前導腳觸地時，踩在後腳跟到本壘板連線的開放側（右投：左腳掌踩在該線左側；左投：右腳掌踩在該線右側），可能促使骨盆旋轉過多，上半身不易跟上發力。\n建議改善腳掌踩位到該連線上方。",
  ],
  KneeDrifting: [
    "前導腳落下後，前導腳膝蓋仍在不斷彎曲，出現不穩定的晃動，會導致動力鏈斷裂，能量無法有效地從下肢轉移至上身。\n建議可以增加前導腳專項肌力創造前腳良好的共同收縮，使得剎車能有效運行。",
  ],
  Stacking: [
    "在前腳觸地瞬間，身體應使脊椎保持在中立位置，確保軀幹在開始旋轉前具備穩定，脫離中立位的旋轉會產生巨大的剪力，增加脊椎、肩關節與手肘（UCL）的負擔",
  ],
  HHS_Early_HP: [
    "軀幹在前導腳觸地前已有肉眼明顯可見地向本壘板旋轉，導致肩髖分離最大幅度出現在前導腳觸地之前或剛落下之時，可能導致肩肘承受較大壓力，且下半身能量傳遞不佳。\n建議可以增加胸椎活動度，及軀幹在旋轉面的共同收縮能力，改善肩髖分離發生時機。",
  ],
  NoHHS_HP: [
    "軀幹扭緊幅度較小，可能原因來自於軀幹順應性不佳，此機制不佳可能會降低球速上限。\n建議可以增加胸椎活動度，及軀幹在旋轉面的共同收縮能力，促使肩髖分離幅度加大。",
    "可能原因來自於骨盆旋轉速度較慢，此機制不佳可能會降低球速上限。\n建議可以增加後髖伸展的速度，同時增加胸椎活動度，促使肩髖分離幅度加大。",
  ],
  HHS_Early_SP: [
    "為了尋求旋轉空間而過度拱背剪力，增加受傷風險。旋轉時應避免脊椎的後拱，確保所有動作繞著中立軸心展開",
  ],
  NoHHS_SP: [
    "後腳（軸心腳）過早離開地面，後腳會迅速縮向前方，使其無法發揮平衡錘的功能，導致骨盆變平、軀幹無法有效前壓",
    "以髖部伸展（把屁股縮到脊椎下方）取代了環繞髖鉸鏈的旋轉，這會使骨盆結構趨於扁平，失去向下傾斜的空間",
  ],
  TrunkFlexion: [
    "球離手時，軀幹前彎幅度應與垂直線夾 40-60 度，以利用軀幹前側彈性並創造出手延伸感。\n建議可以增加前導腳腿後側的柔軟度、骨盆前傾的活動度。",
    "球離手時，脊椎彎曲過多，可能使得椎間盤以及下背部瞬間承受過多的張力。\n建議可以增加髖關節屈曲以及前傾的幅度，透過骨盆達到較向前延伸的出手點。",
  ],
  TrunkDeceleration: [
    "在球出手前軀幹持續做旋轉並未發生近端減速遠端加速，造成力量向手套側後方流失",
  ],
  VerticalArmSwing: [
    "肘部過度向上攀升，或直接向上提起的動作。如果肘部在肩膀仍處於內旋狀態時就外展並高於肩線，會顯著壓縮肩峰下空間，導致撞擊症候群，並增加旋轉肌袖受傷的風險",
    "闊背肌過於緊繃會限制肩胛骨的正常滑動，迫使選手透過提高肘部高度來補償旋轉空間",
  ],
  ScapLoad: [
    "投球手在前導腳觸地時，應做出自然幅度的肩胛骨蓄力後收動作，利用胸大肌延長創造彈性位能，使胸大肌加速帶動肱骨投擲。\n建議可以透過肩膀前側肌肉的按摩放鬆，並增加肩膀共同收縮的能力提升肩膀的穩定度，進而增加肩胛骨蓄力的幅度。",
  ],
  LateArm: [
    "軀幹開始加速時前臂與地面的平行夾角應為 70 度~90 度間，手臂尚未達到準備位置時，旋轉肌袖會處於劣勢，使肩膀暴露於危險的剪力下",
  ],
  ExtensionElbow: [
    "軀幹開始加速時前臂與肱骨夾角大於 90 度，當手肘夾角過大會顯著增加力臂，導致力量的施加方向變得與旋轉軸垂直。這不僅會減少能獲得的肩外旋幅度，還會導致力量傳遞效率低下，進而使球速下降",
  ],
  LowElbow: [
    "在手臂加速期前肩胛骨未進入中立位，使肱骨在手臂加速期無法保持在肩關節球窩的中心，導致關節唇或韌帶需承受較大的壓力",
  ],
  Disconnect: [
    "闊背肌與大圓肌緊繃限制手臂上舉與後擺的能力，外旋角度不足使加速路徑縮短，減少對球施力的時間空間，以及使二頭肌過度收縮以保護肩關節，進而引發關節唇或韌帶的損傷",
  ],
  LeadElbow: [
    "動作時序出現問題，遠端比近端更早加速，導致球投出的那一刻，呈現手肘彎曲的方式將球投出，可能使得手肘承受較大的外翻壓力。",
  ],
  SecondArmSpiral: [
    "肘部會過早伸展，增加手肘尺側副韌帶（UCL）的外翻壓力，並增加肩關節的負擔",
  ],
  MER: [
    "若胸椎無法有效伸展（挺胸），肩胛骨就無法順利向脊椎收縮與下壓，進而阻礙肱骨頭在關節窩中定位，導致無法達成理想的肩外旋\n外旋角度不足使加速路徑縮短，減少對球施力的時間空間，以及使二頭肌過度收縮以保護肩關節，進而引發關節唇或韌帶的損傷",
    "肩膀外旋離心肌力不佳導致自由度受限，建議訓練肩膀周邊肌群提升共同收縮能力改善肩外旋幅度",
  ],
  GloveArmPullEarly: [
    "投球時為了創造胸椎伸展手套手過早拉動，導致軀幹旋轉時機太早",
  ],
  // GloveArmPulling: 無罐頭文字，教練可手動輸入
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

const MechanicsExplanation = ({
  items,
  personalAdvice,
  readOnly = false,
  onPersonalAdviceChange,
}: MechanicsExplanationProps) => {
  const needsExplanation = items.filter((item) => !item.isGood);
  const isAdviceEditable = !readOnly && !!onPersonalAdviceChange;
  const [isEditingAdvice, setIsEditingAdvice] = useState(false);

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
    const fallback = "（此查核點無預設罐頭文字，請點右側鉛筆手動輸入）";
    const state = states[itemId];
    if (!state) return cannedTexts[itemId]?.[0] || fallback;
    if (state.editedText !== null) return state.editedText;
    return cannedTexts[itemId]?.[state.selectedIdx] || fallback;
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
                {!readOnly && hasMultipleCanned && !state?.isEditing && (
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
                {!readOnly && (!state?.isEditing ? (
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
                ))}
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

      {(personalAdvice || isAdviceEditable) && (
        <div
          className={cn(
            "bg-blue-500/5 rounded-lg p-4 border border-blue-500/20",
            isAdviceEditable && !isEditingAdvice && "cursor-text hover:border-blue-500/40 transition-colors"
          )}
          onClick={() => {
            if (isAdviceEditable && !isEditingAdvice) setIsEditingAdvice(true);
          }}
        >
          <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
            教練回覆
          </h4>
          {isAdviceEditable && isEditingAdvice ? (
            <Textarea
              value={personalAdvice || ""}
              onChange={(e) => onPersonalAdviceChange!(e.target.value)}
              onBlur={() => setIsEditingAdvice(false)}
              placeholder="在此輸入教練回覆，儲存時寫入報告..."
              className="min-h-[100px] text-sm bg-background resize-none"
              autoFocus
            />
          ) : personalAdvice ? (
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {personalAdvice}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">點擊輸入教練回覆…</p>
          )}
          {isAdviceEditable && (
            <p className="mt-1.5 text-[10px] text-muted-foreground print:hidden">
              空白時 PDF 輸出不顯示此區塊
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MechanicsExplanation;

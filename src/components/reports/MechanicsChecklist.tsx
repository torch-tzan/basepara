import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export interface MechanicsItem {
  id: string;
  label: string;
  /** true = 表現良好, false = 有進步空間 */
  isGood: boolean;
}

// 打擊機制項目（14 項）
export const battingMechanicsItems: MechanicsItem[] = [
  { id: "HipCoil", label: "髖內旋", isGood: true },
  { id: "TorsoOverCoil", label: "軀幹代償背轉", isGood: false },
  { id: "HipHinge_Hitting", label: "髖屈", isGood: true },
  { id: "RotateAxis", label: "軀幹轉換側彎", isGood: true },
  { id: "RearFootTwist", label: "後腳外扭", isGood: true },
  { id: "LeadLegRetraction", label: "前腳回拉", isGood: false },
  { id: "ArmDragging", label: "手臂拖延", isGood: true },
  { id: "SwingExtension", label: "無延伸", isGood: true },
  { id: "CatapultLoading", label: "二階段蓄力", isGood: false },
  { id: "LinearMove", label: "線性重心", isGood: true },
  { id: "HipShoulderSeperation_Hitting", label: "肩髖分離（彌合）", isGood: true },
  { id: "LeadLegStep", label: "踩位", isGood: true },
  { id: "SwingPlane", label: "揮擊平面", isGood: false },
  { id: "ProximalDeceleration", label: "髖/軀幹 煞車", isGood: true },
];

// 投球機制項目（26 項）
export const pitchingMechanicsItems: MechanicsItem[] = [
  { id: "Drift", label: "未飄移", isGood: true },
  { id: "KneeValgus", label: "膝蓋內外翻", isGood: true },
  { id: "PushRubber", label: "推蹬", isGood: true },
  { id: "HipHinge_Pitching", label: "落下與髖絞鍊動作", isGood: true },
  { id: "LeadLegRatateEarly", label: "過早拉動骨盆旋轉", isGood: false },
  { id: "ClosedStep", label: "踩位過於關閉", isGood: true },
  { id: "OpenStep", label: "踩位過於開放", isGood: true },
  { id: "KneeDrifting", label: "前腳膝蓋穩定", isGood: true },
  { id: "Stacking", label: "核心脫離中立位（軀幹層疊）", isGood: false },
  { id: "HHS_Early_HP", label: "旋轉面肩髖分離時間點過早", isGood: true },
  { id: "NoHHS_HP", label: "旋轉面肩髖分離幅度不足", isGood: true },
  { id: "HHS_Early_SP", label: "矢狀面肩髖分離時間點過早", isGood: false },
  { id: "NoHHS_SP", label: "矢狀面肩髖分離幅度不足", isGood: true },
  { id: "TrunkFlexion", label: "軀幹前壓幅度不足", isGood: true },
  { id: "TrunkDeceleration", label: "軀幹持續轉動", isGood: true },
  { id: "VerticalArmSwing", label: "垂直性提肘", isGood: true },
  { id: "ScapLoad", label: "投球手蓄力不足", isGood: false },
  { id: "LateArm", label: "延遲性手臂", isGood: true },
  { id: "ExtensionElbow", label: "手肘角度過大", isGood: true },
  { id: "LowElbow", label: "手肘位置過低", isGood: true },
  { id: "Disconnect", label: "投球手後躺時跟不上軀幹", isGood: true },
  { id: "LeadElbow", label: "引導性手肘", isGood: true },
  { id: "SecondArmSpiral", label: "無二段螺旋手臂", isGood: false },
  { id: "MER", label: "投球手後躺角度不足", isGood: true },
  { id: "GloveArmPullEarly", label: "過早拉動，導致軀幹旋轉時機太早", isGood: true },
  { id: "GloveArmPulling", label: "手套手持續拉動", isGood: true },
];

interface MechanicsChecklistProps {
  type: "batting" | "pitching";
  items?: MechanicsItem[];
  /** 自訂標題（分頁時可傳「投球動作機制查核（續）」等） */
  title?: string;
}

const MechanicsChecklist = ({ type, items, title: titleOverride }: MechanicsChecklistProps) => {
  const defaultItems = type === "batting" ? battingMechanicsItems : pitchingMechanicsItems;
  const checkItems = items || defaultItems;
  const defaultTitle = type === "batting" ? "打擊動作機制查核" : "投球動作機制查核";
  const title = titleOverride ?? defaultTitle;

  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[50%]">
                {type === "batting" ? "打擊機制" : "投球機制"}
              </th>
              <th className="text-center py-2 px-3 font-medium text-green-600 dark:text-green-400 w-[25%]">
                表現良好
              </th>
              <th className="text-center py-2 px-3 font-medium text-red-600 dark:text-red-400 w-[25%]">
                有進步空間
              </th>
            </tr>
          </thead>
          <tbody>
            {checkItems.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                <td className="py-2 px-3 text-foreground">{item.label}</td>
                <td className="py-2 px-3 text-center">
                  {item.isGood && (
                    <Check className={cn("inline w-4 h-4 text-green-500")} />
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  {!item.isGood && (
                    <X className={cn("inline w-4 h-4 text-red-500")} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MechanicsChecklist;

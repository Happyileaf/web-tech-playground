import { AlertTriangle, ArrowRightLeft, CheckCircle2, PlusCircle, Trash2 } from 'lucide-react';
import KeyStrategyPanel from './KeyStrategyPanel';
import { KEY_STRATEGIES } from '../data/experiments';
import type { KeyStrategyId, StrategyDiffReport, UserItem } from '../types/experiment';

interface ComparisonPanelProps {
  strategyUsers: Record<KeyStrategyId, UserItem[]>;
  operationSeq: number;
  operationLabel: string;
  resetCounter: number;
  onReport: (payload: StrategyDiffReport) => void;
}

export default function ComparisonPanel({
  strategyUsers,
  operationSeq,
  operationLabel,
  resetCounter,
  onReport,
}: ComparisonPanelProps) {
  return (
    <section aria-labelledby="comparison-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="comparison-heading" className="font-display text-lg font-semibold text-slate-900">
            四种 Key 策略同排对比区
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            四列同排等高对齐，逐行对照同一索引位置在 React 19 Fiber 协调下的节点命运、DOM 实例归属与备注状态。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 text-amber-900">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            <span>黄色：状态错位</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sky-800">
            <PlusCircle className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
            <span>蓝色：新建节点</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-800">
            <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>亮绿：复用且发生变化</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-800">
            <Trash2 className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            <span>红色：销毁节点</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>浅灰：复用且无变化</span>
          </span>
        </div>
      </div>

      {/* 一行四列同排等高网格 */}
      <div className="grid items-stretch gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {KEY_STRATEGIES.map((meta) => (
          <KeyStrategyPanel
            key={`${meta.id}-${resetCounter}`}
            meta={meta}
            users={strategyUsers[meta.id]}
            operationSeq={operationSeq}
            operationLabel={operationLabel}
            onReport={onReport}
          />
        ))}
      </div>
    </section>
  );
}

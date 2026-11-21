import {
  ArrowDownUp,
  ListPlus,
  Pencil,
  RefreshCw,
  RotateCcw,
  Scissors,
  Shuffle,
  Trash,
} from 'lucide-react';
import { CLASSIC_EXPERIMENTS } from '../data/experiments';
import type { ClassicExperiment, ExecutionMode, OperationId } from '../types/experiment';

interface OperationPanelProps {
  listLength: number;
  executionMode: ExecutionMode;
  isStepInProgress: boolean;
  activeExperimentId: string | null;
  lastOperationLabel: string;
  onOperate: (id: OperationId) => void;
  onExecutionModeChange: (mode: ExecutionMode) => void;
  onRunExperiment: (experiment: ClassicExperiment) => void;
}

export default function OperationPanel({
  listLength,
  executionMode,
  isStepInProgress,
  activeExperimentId,
  lastOperationLabel,
  onOperate,
  onExecutionModeChange,
  onRunExperiment,
}: OperationPanelProps) {
  const activeExperiment =
    CLASSIC_EXPERIMENTS.find((item) => item.id === activeExperimentId) ?? null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
        <div>
          <h1 className="font-display text-lg font-semibold text-slate-900">
            React 19 列表渲染 Key 差异可视化实验台
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            一次操作同步作用于四列策略，静默项弱化退后，重点高亮新建、销毁、移动与状态错位。
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            当前 {listLength} 人 · {lastOperationLabel}
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="执行模式选择">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                executionMode === 'immediate'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => onExecutionModeChange('immediate')}
            >
              即时执行
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                executionMode === 'step'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => onExecutionModeChange('step')}
            >
              逐步执行
            </button>
          </div>
        </div>
      </div>

      {/* 统一操作区 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={listLength === 0 || isStepInProgress}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => onOperate('delete-first')}
          >
            <Trash className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            <span>删除第一项</span>
          </button>

          <button
            type="button"
            disabled={listLength === 0 || isStepInProgress}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => onOperate('delete-middle')}
          >
            <Scissors className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            <span>删除中间项</span>
          </button>

          <button
            type="button"
            disabled={isStepInProgress}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => onOperate('insert-head')}
          >
            <ListPlus className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
            <span>头部插入</span>
          </button>

          <button
            type="button"
            disabled={isStepInProgress}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => onOperate('insert-middle')}
          >
            <ListPlus className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
            <span>中间插入</span>
          </button>

          <button
            type="button"
            disabled={listLength < 2 || isStepInProgress}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => onOperate('reverse')}
          >
            <ArrowDownUp className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
            <span>反转顺序</span>
          </button>

          <button
            type="button"
            disabled={listLength < 2 || isStepInProgress}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => onOperate('shuffle')}
          >
            <Shuffle className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
            <span>随机排序</span>
          </button>

          <button
            type="button"
            disabled={listLength === 0 || isStepInProgress}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => onOperate('modify-data')}
          >
            <Pencil className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>修改数据</span>
          </button>

          <button
            type="button"
            disabled={isStepInProgress}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => onOperate('parent-rerender')}
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
            <span>父组件重渲染</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white whitespace-nowrap shrink-0 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            onClick={() => onOperate('reset')}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>重置</span>
          </button>
        </div>
      </div>

      {/* 五大经典实验一排快捷入口 */}
      <div className="border-t border-slate-200 pt-3.5 space-y-2.5">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {CLASSIC_EXPERIMENTS.map((exp) => (
            <button
              key={exp.id}
              type="button"
              disabled={isStepInProgress}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                activeExperimentId === exp.id
                  ? 'border-sky-400 bg-sky-50/75 text-slate-900'
                  : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-white'
              }`}
              onClick={() => onRunExperiment(exp)}
            >
              <span className="font-semibold text-sky-700 shrink-0">{exp.number}</span>
              <span className="font-semibold text-slate-900 truncate">{exp.title}</span>
            </button>
          ))}
        </div>

        {activeExperiment && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">
              {activeExperiment.number} · {activeExperiment.title}：
            </span>
            <span className="text-slate-600">{activeExperiment.focusPoints.join('；')}</span>
          </div>
        )}
      </div>
    </section>
  );
}

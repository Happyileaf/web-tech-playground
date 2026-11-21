import { useCallback, useEffect, useRef, useState } from 'react';
import ComparisonPanel from './components/ComparisonPanel';
import DiffStatistics from './components/DiffStatistics';
import ExecutionTimeline from './components/ExecutionTimeline';
import OperationPanel from './components/OperationPanel';
import {
  CORE_TAKEAWAYS,
  INITIAL_USERS,
  NEW_USER_POOL,
  STRATEGY_ORDER,
} from './data/experiments';
import type {
  ClassicExperiment,
  ExecutionMode,
  InstanceMapping,
  KeyStrategyId,
  OperationId,
  PendingStepContext,
  StrategyDiffReport,
  UserItem,
} from './types/experiment';

const cloneUsers = (list: UserItem[]): UserItem[] => list.map((u) => ({ ...u }));

const createStrategyUsers = (list: UserItem[]): Record<KeyStrategyId, UserItem[]> => ({
  'no-key': cloneUsers(list),
  'index-key': cloneUsers(list),
  'unstable-key': cloneUsers(list),
  'stable-key': cloneUsers(list),
});

const createEmptyReports = (): Record<KeyStrategyId, StrategyDiffReport | null> => ({
  'no-key': null,
  'index-key': null,
  'unstable-key': null,
  'stable-key': null,
});

export default function App() {
  const [canonicalUsers, setCanonicalUsers] = useState<UserItem[]>(() => cloneUsers(INITIAL_USERS));
  const [strategyUsers, setStrategyUsers] = useState<Record<KeyStrategyId, UserItem[]>>(() =>
    createStrategyUsers(INITIAL_USERS),
  );

  const [operationSeq, setOperationSeq] = useState(0);
  const [operationLabel, setOperationLabel] = useState('初始挂载');
  const [resetCounter, setResetCounter] = useState(0);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('immediate');
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);

  const [pendingStep, setPendingStep] = useState<PendingStepContext | null>(null);
  const [reports, setReports] = useState<Record<KeyStrategyId, StrategyDiffReport | null>>(
    createEmptyReports,
  );
  const [historyLogs, setHistoryLogs] = useState<
    Array<{
      seq: number;
      operationLabel: string;
      reports: Record<KeyStrategyId, StrategyDiffReport>;
    }>
  >([]);

  const nextNewUserIdRef = useRef(105);
  const newUserPoolIndexRef = useRef(0);
  const modifyCountRef = useRef(0);
  const batchBufferRef = useRef(new Map<number, Partial<Record<KeyStrategyId, StrategyDiffReport>>>());
  const pendingExperimentOpRef = useRef<ClassicExperiment | null>(null);

  const createNewUser = (): UserItem => {
    const template = NEW_USER_POOL[newUserPoolIndexRef.current % NEW_USER_POOL.length];
    newUserPoolIndexRef.current += 1;
    return {
      id: nextNewUserIdRef.current++,
      name: template.name,
      age: template.age,
    };
  };

  const buildNextUsers = (
    opId: OperationId,
    current: UserItem[],
  ): { label: string; summary: string; nextUsers: UserItem[] } | null => {
    switch (opId) {
      case 'delete-first': {
        if (current.length === 0) return null;
        const removed = current[0];
        return {
          label: '删除第一项',
          summary: `移除首位人员 ${removed.name} (ID ${removed.id})`,
          nextUsers: cloneUsers(current.slice(1)),
        };
      }
      case 'delete-middle': {
        if (current.length === 0) return null;
        const mid = Math.floor(current.length / 2);
        const removed = current[mid];
        return {
          label: '删除中间项',
          summary: `移除索引 ${mid} 处人员 ${removed.name} (ID ${removed.id})`,
          nextUsers: cloneUsers(current.filter((_, idx) => idx !== mid)),
        };
      }
      case 'insert-head': {
        const newcomer = createNewUser();
        return {
          label: '头部插入',
          summary: `在头部插入新人员 ${newcomer.name} (ID ${newcomer.id})`,
          nextUsers: [newcomer, ...cloneUsers(current)],
        };
      }
      case 'insert-middle': {
        const newcomer = createNewUser();
        const mid = Math.floor(current.length / 2);
        const next = cloneUsers(current);
        next.splice(mid, 0, newcomer);
        return {
          label: '中间插入',
          summary: `在索引 ${mid} 处插入新人员 ${newcomer.name} (ID ${newcomer.id})`,
          nextUsers: next,
        };
      }
      case 'reverse': {
        if (current.length < 2) return null;
        return {
          label: '反转顺序',
          summary: '将当前列表顺序完全反转',
          nextUsers: cloneUsers(current).reverse(),
        };
      }
      case 'shuffle': {
        if (current.length < 2) return null;
        const next = cloneUsers(current);
        for (let i = next.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [next[i], next[j]] = [next[j], next[i]];
        }
        const unchanged = next.every((item, idx) => item.id === current[idx].id);
        if (unchanged) {
          [next[0], next[1]] = [next[1], next[0]];
        }
        return {
          label: '随机排序',
          summary: '随机打乱列表项顺序',
          nextUsers: next,
        };
      }
      case 'modify-data': {
        if (current.length === 0) return null;
        modifyCountRef.current += 1;
        const targetIndex = current.findIndex((u) => u.id === 101);
        const idx = targetIndex >= 0 ? targetIndex : 0;
        const next = cloneUsers(current);
        const baseName = next[idx].name.replace(/（第\d+次修改）$/, '');
        next[idx] = {
          ...next[idx],
          name: `${baseName}（第${modifyCountRef.current}次修改）`,
          age: next[idx].age + 1,
        };
        return {
          label: '修改数据',
          summary: `更新 ${baseName} (ID ${next[idx].id}) 的姓名与年龄，ID 保持不变`,
          nextUsers: next,
        };
      }
      case 'parent-rerender': {
        return {
          label: '父组件重渲染',
          summary: '列表数据未变，仅触发父组件重新渲染',
          nextUsers: cloneUsers(current),
        };
      }
      default:
        return null;
    }
  };

  const commitListUpdate = (label: string, nextUsers: UserItem[]) => {
    setCanonicalUsers(cloneUsers(nextUsers));
    setStrategyUsers(createStrategyUsers(nextUsers));
    setOperationLabel(label);
    setOperationSeq((prev) => prev + 1);
  };

  const resetWithUsers = (presetUsers: UserItem[], clearExperimentId = true) => {
    setPendingStep(null);
    if (clearExperimentId) {
      setActiveExperimentId(null);
    }
    nextNewUserIdRef.current = 105;
    newUserPoolIndexRef.current = 0;
    modifyCountRef.current = 0;
    batchBufferRef.current.clear();
    setReports(createEmptyReports());
    setHistoryLogs([]);

    setCanonicalUsers(cloneUsers(presetUsers));
    setStrategyUsers(createStrategyUsers(presetUsers));
    setOperationLabel('初始挂载');
    setOperationSeq(0);
    setResetCounter((prev) => prev + 1);
  };

  const handleOperate = (opId: OperationId) => {
    if (opId === 'reset') {
      pendingExperimentOpRef.current = null;
      resetWithUsers(INITIAL_USERS, true);
      return;
    }

    const plan = buildNextUsers(opId, canonicalUsers);
    if (!plan) return;

    if (executionMode === 'immediate') {
      commitListUpdate(plan.label, plan.nextUsers);
      return;
    }

    const beforeMappings: Record<KeyStrategyId, InstanceMapping[]> = {
      'no-key': reports['no-key']?.afterMappings ?? [],
      'index-key': reports['index-key']?.afterMappings ?? [],
      'unstable-key': reports['unstable-key']?.afterMappings ?? [],
      'stable-key': reports['stable-key']?.afterMappings ?? [],
    };

    setPendingStep({
      operationId: opId,
      operationLabel: plan.label,
      operationSummary: plan.summary,
      phase: 1,
      beforeUsers: cloneUsers(canonicalUsers),
      nextUsers: cloneUsers(plan.nextUsers),
      beforeMappings,
      unstablePreviewNewKeys: plan.nextUsers.map(
        () => `rnd_${Math.random().toString(36).slice(2, 7)}`,
      ),
    });
  };

  const handleNextStep = () => {
    if (!pendingStep || pendingStep.phase >= 5) return;
    const nextPhase = (pendingStep.phase + 1) as 1 | 2 | 3 | 4 | 5;
    setPendingStep({
      ...pendingStep,
      phase: nextPhase,
    });

    if (nextPhase === 4) {
      commitListUpdate(pendingStep.operationLabel, pendingStep.nextUsers);
    }
  };

  const handleFinishStep = () => {
    if (!pendingStep) return;
    if (pendingStep.phase < 4) {
      commitListUpdate(pendingStep.operationLabel, pendingStep.nextUsers);
    }
    setPendingStep({
      ...pendingStep,
      phase: 5,
    });
  };

  const handleRunExperiment = (exp: ClassicExperiment) => {
    setActiveExperimentId(exp.id);
    pendingExperimentOpRef.current = exp;
    resetWithUsers(exp.presetUsers, false);
  };

  useEffect(() => {
    if (operationSeq !== 0 || !pendingExperimentOpRef.current) return;
    const exp = pendingExperimentOpRef.current;
    pendingExperimentOpRef.current = null;
    handleOperate(exp.operationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCounter, operationSeq]);

  const handleReport = useCallback((payload: StrategyDiffReport) => {
    setReports((prev) => ({
      ...prev,
      [payload.strategy]: payload,
    }));

    if (payload.operationSeq === 0) return;

    const bucket = batchBufferRef.current.get(payload.operationSeq) ?? {};
    bucket[payload.strategy] = payload;
    batchBufferRef.current.set(payload.operationSeq, bucket);

    const isComplete = STRATEGY_ORDER.every((id) => Boolean(bucket[id]));
    if (isComplete) {
      const finalized: Record<KeyStrategyId, StrategyDiffReport> = {
        'no-key': bucket['no-key']!,
        'index-key': bucket['index-key']!,
        'unstable-key': bucket['unstable-key']!,
        'stable-key': bucket['stable-key']!,
      };
      setHistoryLogs((prev) => [
        {
          seq: payload.operationSeq,
          operationLabel: payload.operationLabel,
          reports: finalized,
        },
        ...prev.slice(0, 9),
      ]);
      batchBufferRef.current.delete(payload.operationSeq);
    }
  }, []);

  const isStepInProgress = pendingStep !== null && pendingStep.phase < 5;

  const handleExecutionModeChange = (mode: ExecutionMode) => {
    if (mode === 'immediate' && pendingStep && pendingStep.phase < 5) {
      handleFinishStep();
      setPendingStep(null);
    } else if (mode === 'immediate') {
      setPendingStep(null);
    }
    setExecutionMode(mode);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
          <a
            href="#top"
            className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            React Key Playground
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#operations-section"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              统一操作区
            </a>
            <a
              href="#comparison-section"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              同排策略对比
            </a>
            <a
              href="#stats-section"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              变化焦点
            </a>
            <a
              href="#timeline-section"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              逐步执行
            </a>
            <a
              href="#takeaways-section"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              教学结论
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white whitespace-nowrap shrink-0 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              onClick={() => handleOperate('reset')}
            >
              重置实验
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* 1. 统一操作区 */}
        <div id="operations-section">
          <OperationPanel
            listLength={canonicalUsers.length}
            executionMode={executionMode}
            isStepInProgress={isStepInProgress}
            activeExperimentId={activeExperimentId}
            lastOperationLabel={operationLabel}
            onOperate={handleOperate}
            onExecutionModeChange={handleExecutionModeChange}
            onRunExperiment={handleRunExperiment}
          />
        </div>

        {/* 2. 四种 Key 策略同排等高对比区（1 行 4 列） */}
        <div id="comparison-section">
          <ComparisonPanel
            strategyUsers={strategyUsers}
            operationSeq={operationSeq}
            operationLabel={operationLabel}
            resetCounter={resetCounter}
            onReport={handleReport}
          />
        </div>

        {/* 3. 真实变化焦点区（非动态表格） */}
        <div id="stats-section">
          <DiffStatistics historyLogs={historyLogs} />
        </div>

        {/* 4. 逐步执行时间线 */}
        <div id="timeline-section">
          <ExecutionTimeline
            pendingStep={pendingStep}
            reports={reports}
            lastOperationLabel={operationLabel}
            onNextStep={handleNextStep}
            onFinishStep={handleFinishStep}
          />
        </div>

        {/* 5. 核心教学结论 */}
        <section
          id="takeaways-section"
          className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
        >
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              核心教学结论：理解 key 的本质价值
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              key 的核心作用不是“给 DOM 编唯一编号”，而是帮助 React 在新旧 Fiber 之间建立稳定可靠的身份对应关系。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {CORE_TAKEAWAYS.map((item) => (
              <article
                key={item.number}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-4"
              >
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  <span className="font-mono text-sky-700 mr-1.5">{item.number}.</span>
                  <span>{item.title}</span>
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

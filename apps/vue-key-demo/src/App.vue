<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import ComparisonPanel from './components/ComparisonPanel.vue';
import DiffStatistics from './components/DiffStatistics.vue';
import ExecutionTimeline from './components/ExecutionTimeline.vue';
import OperationPanel from './components/OperationPanel.vue';
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

const canonicalUsers = ref<UserItem[]>(cloneUsers(INITIAL_USERS));
const strategyUsers = ref<Record<KeyStrategyId, UserItem[]>>(createStrategyUsers(INITIAL_USERS));

const operationSeq = ref(0);
const operationLabel = ref('初始挂载');
const resetCounter = ref(0);
const executionMode = ref<ExecutionMode>('immediate');
const activeExperimentId = ref<string | null>(null);

const pendingStep = ref<PendingStepContext | null>(null);
const reports = ref<Record<KeyStrategyId, StrategyDiffReport | null>>(createEmptyReports());
const historyLogs = ref<
  Array<{
    seq: number;
    operationLabel: string;
    reports: Record<KeyStrategyId, StrategyDiffReport>;
  }>
>([]);

// 用于新增人员的唯一 ID 与姓名生成
let nextNewUserId = 105;
let newUserPoolIndex = 0;
let modifyCount = 0;

// 收集同一操作周期内四组面板上报的真实统计
const batchBuffer = new Map<number, Partial<Record<KeyStrategyId, StrategyDiffReport>>>();

const createNewUser = (): UserItem => {
  const template = NEW_USER_POOL[newUserPoolIndex % NEW_USER_POOL.length];
  newUserPoolIndex += 1;
  return {
    id: nextNewUserId++,
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
      modifyCount += 1;
      const targetIndex = current.findIndex((u) => u.id === 101);
      const idx = targetIndex >= 0 ? targetIndex : 0;
      const next = cloneUsers(current);
      const baseName = next[idx].name.replace(/（第\d+次修改）$/, '');
      next[idx] = {
        ...next[idx],
        name: `${baseName}（第${modifyCount}次修改）`,
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
  canonicalUsers.value = cloneUsers(nextUsers);
  strategyUsers.value = createStrategyUsers(nextUsers);
  operationLabel.value = label;
  operationSeq.value += 1;
};

const resetWithUsers = async (presetUsers: UserItem[], clearExperimentId = true) => {
  pendingStep.value = null;
  if (clearExperimentId) {
    activeExperimentId.value = null;
  }
  nextNewUserId = 105;
  newUserPoolIndex = 0;
  modifyCount = 0;
  batchBuffer.clear();
  reports.value = createEmptyReports();
  historyLogs.value = [];

  canonicalUsers.value = cloneUsers(presetUsers);
  strategyUsers.value = createStrategyUsers(presetUsers);
  operationLabel.value = '初始挂载';
  operationSeq.value = 0;
  resetCounter.value += 1;
  await nextTick();
  await nextTick();
};

const handleOperate = (opId: OperationId) => {
  if (opId === 'reset') {
    void resetWithUsers(INITIAL_USERS, true);
    return;
  }

  const plan = buildNextUsers(opId, canonicalUsers.value);
  if (!plan) return;

  if (executionMode.value === 'immediate') {
    commitListUpdate(plan.label, plan.nextUsers);
    return;
  }

  // 逐步执行模式：先停留在阶段 1（操作前）
  const beforeMappings: Record<KeyStrategyId, InstanceMapping[]> = {
    'no-key': reports.value['no-key']?.afterMappings ?? [],
    'index-key': reports.value['index-key']?.afterMappings ?? [],
    'unstable-key': reports.value['unstable-key']?.afterMappings ?? [],
    'stable-key': reports.value['stable-key']?.afterMappings ?? [],
  };

  pendingStep.value = {
    operationId: opId,
    operationLabel: plan.label,
    operationSummary: plan.summary,
    phase: 1,
    beforeUsers: cloneUsers(canonicalUsers.value),
    nextUsers: cloneUsers(plan.nextUsers),
    beforeMappings,
    unstablePreviewNewKeys: plan.nextUsers.map(
      () => `rnd_${Math.random().toString(36).slice(2, 7)}`,
    ),
  };
};

const handleNextStep = () => {
  if (!pendingStep.value) return;
  const currentPhase = pendingStep.value.phase;
  if (currentPhase >= 5) return;

  const nextPhase = (currentPhase + 1) as 1 | 2 | 3 | 4 | 5;
  pendingStep.value = {
    ...pendingStep.value,
    phase: nextPhase,
  };

  if (nextPhase === 4) {
    commitListUpdate(pendingStep.value.operationLabel, pendingStep.value.nextUsers);
  }
};

const handleFinishStep = () => {
  if (!pendingStep.value) return;
  if (pendingStep.value.phase < 4) {
    commitListUpdate(pendingStep.value.operationLabel, pendingStep.value.nextUsers);
  }
  pendingStep.value = {
    ...pendingStep.value,
    phase: 5,
  };
};

const handleRunExperiment = async (exp: ClassicExperiment) => {
  activeExperimentId.value = exp.id;
  await resetWithUsers(exp.presetUsers, false);
  handleOperate(exp.operationId);
};

const handleReport = (payload: StrategyDiffReport) => {
  reports.value[payload.strategy] = payload;

  if (payload.operationSeq === 0) return;

  const bucket = batchBuffer.get(payload.operationSeq) ?? {};
  bucket[payload.strategy] = payload;
  batchBuffer.set(payload.operationSeq, bucket);

  const isComplete = STRATEGY_ORDER.every((id) => Boolean(bucket[id]));
  if (isComplete) {
    const finalized = {
      'no-key': bucket['no-key']!,
      'index-key': bucket['index-key']!,
      'unstable-key': bucket['unstable-key']!,
      'stable-key': bucket['stable-key']!,
    };
    historyLogs.value = [
      {
        seq: payload.operationSeq,
        operationLabel: payload.operationLabel,
        reports: finalized,
      },
      ...historyLogs.value.slice(0, 9),
    ];
    batchBuffer.delete(payload.operationSeq);
  }
};

const isStepInProgress = computed(() => {
  return pendingStep.value !== null && pendingStep.value.phase < 5;
});

const handleExecutionModeChange = (mode: ExecutionMode) => {
  if (mode === 'immediate' && pendingStep.value && pendingStep.value.phase < 5) {
    handleFinishStep();
    pendingStep.value = null;
  } else if (mode === 'immediate') {
    pendingStep.value = null;
  }
  executionMode.value = mode;
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Top Bar Contract: 3 Zones separated by gap-8 -->
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-[1600px] items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="#top"
          class="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Vue Key Playground
        </a>

        <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#operations-section"
            class="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            统一操作区
          </a>
          <a
            href="#comparison-section"
            class="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            同排策略对比
          </a>
          <a
            href="#stats-section"
            class="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            变化焦点
          </a>
          <a
            href="#timeline-section"
            class="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            逐步执行
          </a>
          <a
            href="#takeaways-section"
            class="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            教学结论
          </a>
        </nav>

        <div class="flex items-center shrink-0">
          <button
            type="button"
            class="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white whitespace-nowrap shrink-0 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            @click="handleOperate('reset')"
          >
            重置实验
          </button>
        </div>
      </div>
    </header>

    <main id="top" class="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <!-- 1. 统一操作区 -->
      <div id="operations-section">
        <OperationPanel
          :list-length="canonicalUsers.length"
          :execution-mode="executionMode"
          :is-step-in-progress="isStepInProgress"
          :active-experiment-id="activeExperimentId"
          :last-operation-label="operationLabel"
          @operate="handleOperate"
          @update:execution-mode="handleExecutionModeChange"
          @run-experiment="handleRunExperiment"
        />
      </div>

      <!-- 2. 四种 Key 策略同排等高对比区（1 行 4 列） -->
      <div id="comparison-section">
        <ComparisonPanel
          :strategy-users="strategyUsers"
          :operation-seq="operationSeq"
          :operation-label="operationLabel"
          :reset-counter="resetCounter"
          @report="handleReport"
        />
      </div>

      <!-- 3. 真实变化焦点区（非动态表格） -->
      <div id="stats-section">
        <DiffStatistics :reports="reports" :history-logs="historyLogs" />
      </div>

      <!-- 4. 逐步执行时间线 -->
      <div id="timeline-section">
        <ExecutionTimeline
          :pending-step="pendingStep"
          :reports="reports"
          :last-operation-label="operationLabel"
          @next-step="handleNextStep"
          @finish-step="handleFinishStep"
        />
      </div>

      <!-- 4. 最终教学结论 -->
      <section
        id="takeaways-section"
        class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
      >
        <div>
          <h2 class="font-display text-lg font-semibold text-slate-900">
            核心教学结论：理解 key 的本质价值
          </h2>
          <p class="mt-1 text-xs text-slate-500">
            key 的核心作用不是“给 DOM 编唯一编号”，而是帮助 Vue 在新旧 VNode 之间建立稳定可靠的身份对应关系。
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-for="item in CORE_TAKEAWAYS"
            :key="item.number"
            class="rounded-lg border border-slate-200 bg-slate-50/70 p-4"
          >
            <h3 class="font-display text-sm font-semibold text-slate-900">
              <span class="font-mono text-sky-700 mr-1.5">{{ item.number }}.</span>
              <span>{{ item.title }}</span>
            </h3>
            <p class="mt-2 text-xs leading-relaxed text-slate-600">
              {{ item.body }}
            </p>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

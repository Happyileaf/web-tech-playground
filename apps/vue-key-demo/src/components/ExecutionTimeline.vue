<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight, CheckCircle2, FastForward, Play } from 'lucide-vue-next';
import { KEY_STRATEGIES } from '../data/experiments';
import type { KeyStrategyId, PendingStepContext, StepPhase, StrategyDiffReport } from '../types/experiment';

const props = defineProps<{
  pendingStep: PendingStepContext | null;
  reports: Record<KeyStrategyId, StrategyDiffReport | null>;
  lastOperationLabel: string;
}>();

const emit = defineEmits<{
  nextStep: [];
  finishStep: [];
}>();

const PHASES: Array<{ step: StepPhase; title: string; subtitle: string }> = [
  { step: 1, title: '1. 操作前', subtitle: '原始列表与组件实例' },
  { step: 2, title: '2. 数据变化', subtitle: '响应式数据阵列变更' },
  { step: 3, title: '3. 新旧 VNode 对比', subtitle: '教学示意：Key 匹配规则' },
  { step: 4, title: '4. 组件更新', subtitle: '执行真实挂载/复用/卸载' },
  { step: 5, title: '5. 更新完成', subtitle: '最终 DOM 与内部状态' },
];

const activePhase = computed<StepPhase>(() => {
  if (props.pendingStep) return props.pendingStep.phase;
  return 5;
});

interface MatchPreviewItem {
  newIndex: number;
  userName: string;
  userId: number;
  newKeyLabel: string;
  matchedOldInstance: string | null;
  matchedOldOwner: string | null;
  outcome: 'reuse-same' | 'reuse-mismatch' | 'create';
}

const buildStrategyPreview = (strategy: KeyStrategyId): MatchPreviewItem[] => {
  if (!props.pendingStep) return [];
  const before = props.pendingStep.beforeMappings[strategy] ?? [];
  const nextUsers = props.pendingStep.nextUsers;

  return nextUsers.map((user, idx) => {
    if (strategy === 'no-key' || strategy === 'index-key') {
      const oldAtSameIndex = before[idx] ?? null;
      const newKeyLabel = strategy === 'no-key' ? '未配置' : String(idx);
      if (!oldAtSameIndex) {
        return {
          newIndex: idx,
          userName: user.name,
          userId: user.id,
          newKeyLabel,
          matchedOldInstance: null,
          matchedOldOwner: null,
          outcome: 'create',
        };
      }
      return {
        newIndex: idx,
        userName: user.name,
        userId: user.id,
        newKeyLabel,
        matchedOldInstance: oldAtSameIndex.instanceId,
        matchedOldOwner: oldAtSameIndex.userName,
        outcome: oldAtSameIndex.initialOwnerId === user.id ? 'reuse-same' : 'reuse-mismatch',
      };
    }

    if (strategy === 'unstable-key') {
      const newKeyLabel = props.pendingStep?.unstablePreviewNewKeys[idx] ?? 'rnd_new';
      return {
        newIndex: idx,
        userName: user.name,
        userId: user.id,
        newKeyLabel,
        matchedOldInstance: null,
        matchedOldOwner: null,
        outcome: 'create',
      };
    }

    // stable-key
    const matchedOld = before.find((item) => item.userId === user.id) ?? null;
    return {
      newIndex: idx,
      userName: user.name,
      userId: user.id,
      newKeyLabel: String(user.id),
      matchedOldInstance: matchedOld?.instanceId ?? null,
      matchedOldOwner: matchedOld?.userName ?? null,
      outcome: matchedOld ? 'reuse-same' : 'create',
    };
  });
};

const previewByStrategy = computed(() => {
  return KEY_STRATEGIES.map((meta) => ({
    meta,
    items: buildStrategyPreview(meta.id),
  }));
});
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="font-display text-lg font-semibold text-slate-900">
          逐步执行教学时间线
        </h2>
        <p class="mt-1 text-xs text-slate-500">
          明确区分“数据变更”“教学级 Key 匹配推演”与“Vue 真实组件更新”，便于理解为什么不同 Key 会产生不同结果。
        </p>
      </div>

      <!-- 步骤控制按钮 -->
      <div v-if="pendingStep && pendingStep.phase < 5" class="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white whitespace-nowrap shrink-0 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          @click="emit('nextStep')"
        >
          <Play class="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {{ pendingStep.phase === 3 ? '下一步：执行真实组件更新' : '下一步' }}
          </span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="emit('finishStep')"
        >
          <FastForward class="h-3.5 w-3.5" aria-hidden="true" />
          <span>直接完成</span>
        </button>
      </div>
    </div>

    <!-- 五阶段进度条 -->
    <ol class="grid gap-2.5 sm:grid-cols-5">
      <li
        v-for="item in PHASES"
        :key="item.step"
        class="rounded-lg border px-3.5 py-3 transition-colors"
        :class="
          activePhase === item.step
            ? 'border-sky-400 bg-sky-50/75 text-slate-900'
            : activePhase > item.step
              ? 'border-emerald-200 bg-emerald-50/50 text-slate-800'
              : 'border-slate-200 bg-slate-50/50 text-slate-500'
        "
      >
        <div class="flex items-center justify-between gap-2 text-xs font-semibold">
          <span>{{ item.title }}</span>
          <CheckCircle2
            v-if="activePhase > item.step || (!pendingStep && item.step === 5)"
            class="h-3.5 w-3.5 text-emerald-600 shrink-0"
            aria-hidden="true"
          />
        </div>
        <div class="mt-1 text-[11px] leading-snug opacity-85">{{ item.subtitle }}</div>
      </li>
    </ol>

    <!-- 阶段详情内容 -->
    <div v-if="pendingStep" class="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 text-xs">
        <span class="font-semibold text-slate-900">
          当前演示操作：{{ pendingStep.operationLabel }}（{{ pendingStep.operationSummary }}）
        </span>
        <span class="font-mono text-slate-500 tabular-nums">
          阶段 {{ pendingStep.phase }} / 5
        </span>
      </div>

      <!-- Stage 1: 操作前 -->
      <div v-if="pendingStep.phase === 1" class="space-y-2 text-xs text-slate-700">
        <p class="font-medium text-slate-900">
          阶段一（操作前）：尚未修改响应式数据，当前四组列表均保留原有组件实例与输入框状态。
        </p>
        <div class="font-mono text-slate-600">
          当前数组：[{{ pendingStep.beforeUsers.map((u) => `${u.id}:${u.name}`).join(', ') }}]
        </div>
      </div>

      <!-- Stage 2: 数据变化 -->
      <div v-else-if="pendingStep.phase === 2" class="space-y-3 text-xs">
        <p class="font-medium text-slate-900">
          阶段二（数据变化）：即将提交的响应式列表变更如下（此时尚未进入 DOM Patch）：
        </p>
        <div class="grid gap-3 md:grid-cols-2 font-mono">
          <div class="rounded-md border border-slate-200 bg-white p-3">
            <div class="mb-1.5 font-sans font-semibold text-slate-500">变化前 users</div>
            <div class="text-slate-700">
              {{ pendingStep.beforeUsers.map((u, i) => `[${i}] ${u.name}(id:${u.id}, ${u.age}岁)`).join(' → ') || '(空)' }}
            </div>
          </div>
          <div class="rounded-md border border-sky-200 bg-white p-3">
            <div class="mb-1.5 font-sans font-semibold text-sky-700">变化后 users</div>
            <div class="text-slate-900">
              {{ pendingStep.nextUsers.map((u, i) => `[${i}] ${u.name}(id:${u.id}, ${u.age}岁)`).join(' → ') || '(空)' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Stage 3: 新旧 VNode 对比（教学示意） -->
      <div v-else-if="pendingStep.phase === 3" class="space-y-3 text-xs">
        <div class="rounded-md border border-sky-200 bg-white px-3.5 py-2.5 text-slate-700">
          <span class="font-semibold text-slate-900">教学说明：</span>
          下方仅根据四种策略的 <code class="font-mono text-sky-700">key</code> 规则推演新旧 VNode 的身份匹配预期，并非逐条模拟 Vue 内部底层 Diff 指令。点击「下一步」后将触发 Vue 真实组件更新。
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div
            v-for="entry in previewByStrategy"
            :key="entry.meta.id"
            class="rounded-md border border-slate-200 bg-white p-3 space-y-2"
          >
            <div class="font-semibold text-slate-900">{{ entry.meta.orderLabel }}. {{ entry.meta.title }}</div>
            <ul class="space-y-1 font-mono text-[11px]">
              <li
                v-for="item in entry.items"
                :key="item.newIndex"
                class="flex items-center justify-between gap-2"
              >
                <span class="text-slate-700">
                  新[{{ item.newIndex }}] {{ item.userName }} (key={{ item.newKeyLabel }})
                </span>
                <span class="inline-flex items-center gap-1">
                  <ArrowRight class="h-3 w-3 text-slate-400" aria-hidden="true" />
                  <span
                    v-if="item.outcome === 'reuse-same'"
                    class="text-emerald-700 font-medium"
                  >
                    复用 {{ item.matchedOldInstance }}
                  </span>
                  <span
                    v-else-if="item.outcome === 'reuse-mismatch'"
                    class="text-amber-800 font-medium"
                  >
                    复用 {{ item.matchedOldInstance }}(原:{{ item.matchedOldOwner }}，预期错位)
                  </span>
                  <span v-else class="text-sky-700 font-medium">
                    无匹配旧 key，预期新建
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Stage 4: 组件更新 -->
      <div v-else-if="pendingStep.phase === 4" class="space-y-3 text-xs text-slate-700">
        <p class="font-medium text-slate-900">
          阶段四（组件更新）：已将新数据提交给 Vue 3 真实渲染，各面板中的绿色（复用）、蓝色（新建）、红色（销毁）、黄色（状态错位）均来自真实生命周期钩子。
        </p>
        <div class="grid gap-2 sm:grid-cols-4 font-mono">
          <div
            v-for="meta in KEY_STRATEGIES"
            :key="meta.id"
            class="rounded-md border border-slate-200 bg-white px-3 py-2 tabular-nums"
          >
            <div class="font-sans font-semibold text-slate-900">{{ meta.shortTitle }}</div>
            <div class="mt-1 text-slate-600">
              复用 {{ reports[meta.id]?.reusedCount ?? 0 }} /
              新建 {{ reports[meta.id]?.createdCount ?? 0 }} /
              销毁 {{ reports[meta.id]?.destroyedCount ?? 0 }}
            </div>
          </div>
        </div>
      </div>

      <!-- Stage 5: 更新完成 -->
      <div v-else class="text-xs text-emerald-900 font-medium">
        阶段五（更新完成）：本次逐步演示已完成。可继续修改卡片备注、切换回即时执行，或发起下一次操作。
      </div>
    </div>

    <div v-else class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
      当前处于「即时执行」模式（最近状态：{{ lastOperationLabel }}）。切换到右上角「逐步执行」模式后，下一次列表操作将按以上五个阶段分步展开。
    </div>
  </section>
</template>

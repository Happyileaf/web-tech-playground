<script setup lang="ts">
import { computed } from 'vue';
import { KEY_STRATEGIES } from '../data/experiments';
import type { InstanceMapping, KeyStrategyId, StrategyDiffReport } from '../types/experiment';

const props = defineProps<{
  reports: Record<KeyStrategyId, StrategyDiffReport | null>;
  historyLogs: Array<{
    seq: number;
    operationLabel: string;
    reports: Record<KeyStrategyId, StrategyDiffReport>;
  }>;
}>();

const latestLog = computed(() => props.historyLogs[0] ?? null);

interface HighlightDeltaItem {
  kind: 'mismatch' | 'created' | 'destroyed' | 'moved' | 'updated';
  label: string;
  detail: string;
}

const extractChangedItems = (report: StrategyDiffReport): {
  deltas: HighlightDeltaItem[];
  unchangedCount: number;
} => {
  const beforeByInstance = new Map<string, InstanceMapping>(
    report.beforeMappings.map((item) => [item.instanceId, item]),
  );
  const deltas: HighlightDeltaItem[] = [];
  let unchangedCount = 0;

  for (const after of report.afterMappings) {
    if (after.isNewlyMounted) {
      deltas.push({
        kind: 'created',
        label: `新建 ${after.instanceId}`,
        detail: `挂载 ${after.userName} (索引 ${after.index})`,
      });
      continue;
    }

    if (after.isMismatched) {
      deltas.push({
        kind: 'mismatch',
        label: `错位 ${after.instanceId}`,
        detail: `原 ${after.initialOwnerName} → 现 ${after.userName}`,
      });
      continue;
    }

    const prev = beforeByInstance.get(after.instanceId);
    if (prev && prev.index !== after.index) {
      deltas.push({
        kind: 'moved',
        label: `移动 ${after.instanceId}`,
        detail: `${after.userName}：位置 ${prev.index} → ${after.index}`,
      });
      continue;
    }

    if (prev && prev.userName !== after.userName) {
      deltas.push({
        kind: 'updated',
        label: `更新 ${after.instanceId}`,
        detail: `${prev.userName} → ${after.userName}`,
      });
      continue;
    }

    unchangedCount += 1;
  }

  for (const dead of report.destroyedRecords) {
    deltas.push({
      kind: 'destroyed',
      label: `销毁 ${dead.instanceId}`,
      detail: `卸载原 ${dead.userName}`,
    });
  }

  return { deltas, unchangedCount };
};

const changeColumns = computed(() => {
  if (!latestLog.value) return [];
  return KEY_STRATEGIES.map((meta) => {
    const report = latestLog.value!.reports[meta.id];
    return {
      meta,
      report,
      ...extractChangedItems(report),
    };
  });
});
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 class="font-display text-base font-semibold text-slate-900">
          本次操作真实变化焦点
        </h2>
        <p class="mt-0.5 text-xs text-slate-500">
          仅突出显示真实发生创建、销毁、移动、字段更新或状态错位的实例，未受影响节点自动折叠。
        </p>
      </div>
      <span v-if="latestLog" class="font-mono text-xs text-slate-600 tabular-nums">
        第 {{ latestLog.seq }} 次操作 · {{ latestLog.operationLabel }}
      </span>
    </div>

    <div
      v-if="!latestLog"
      class="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500"
    >
      执行任意列表操作或点击经典实验后，此处将按四列对照展示本次真正发生变化与错位的组件实例。
    </div>

    <!-- 一行四列等高变化焦点区（非动态表格） -->
    <div v-else class="grid items-stretch gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="col in changeColumns"
        :key="col.meta.id"
        class="flex h-full flex-col rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs"
      >
        <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <span class="font-semibold text-slate-900">
            {{ col.meta.orderLabel }}. {{ col.meta.shortTitle }}
          </span>
          <span class="font-mono text-[11px] text-slate-500 tabular-nums">
            {{ col.deltas.length }} 项变化
          </span>
        </div>

        <ul class="mt-2.5 flex-1 space-y-1.5 font-mono text-[11px]">
          <li
            v-for="(delta, idx) in col.deltas"
            :key="idx"
            class="flex items-center justify-between gap-2 rounded border px-2 py-1"
            :class="
              delta.kind === 'mismatch'
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : delta.kind === 'created'
                  ? 'border-sky-200 bg-sky-50 text-sky-900'
                  : delta.kind === 'destroyed'
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            "
          >
            <span class="font-semibold shrink-0">{{ delta.label }}</span>
            <span class="truncate text-right">{{ delta.detail }}</span>
          </li>

          <li
            v-if="col.deltas.length === 0"
            class="rounded border border-slate-200 bg-white px-2 py-2 text-center font-sans text-slate-500"
          >
            所有实例原位复用，无结构或身份变化
          </li>
        </ul>

        <div class="mt-2.5 border-t border-slate-200 pt-2 text-[11px] text-slate-400 tabular-nums">
          未变化静默复用：{{ col.unchangedCount }} 个实例
        </div>
      </article>
    </div>
  </section>
</template>

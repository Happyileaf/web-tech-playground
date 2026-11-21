<script setup lang="ts">
import { AlertTriangle, ArrowRightLeft, CheckCircle2, PlusCircle, Trash2 } from 'lucide-vue-next';
import KeyStrategyPanel from './KeyStrategyPanel.vue';
import { KEY_STRATEGIES } from '../data/experiments';
import type { KeyStrategyId, StrategyDiffReport, UserItem } from '../types/experiment';

defineProps<{
  strategyUsers: Record<KeyStrategyId, UserItem[]>;
  operationSeq: number;
  operationLabel: string;
  resetCounter: number;
}>();

const emit = defineEmits<{
  report: [payload: StrategyDiffReport];
}>();
</script>

<template>
  <section aria-labelledby="comparison-heading" class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 id="comparison-heading" class="font-display text-lg font-semibold text-slate-900">
          四种 Key 策略同排对比区
        </h2>
        <p class="mt-0.5 text-xs text-slate-500">
          四列同排等高对齐，逐行对照同一索引位置在不同策略下的节点命运、DOM 实例归属与备注状态。
        </p>
      </div>

      <!-- 统一视觉语义图例（突出变化与静止的视觉层级） -->
      <div class="flex flex-wrap items-center gap-4 text-xs font-medium">
        <span class="inline-flex items-center gap-1.5 text-amber-900">
          <AlertTriangle class="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
          <span>黄色：状态错位</span>
        </span>
        <span class="inline-flex items-center gap-1.5 text-sky-800">
          <PlusCircle class="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
          <span>蓝色：新建节点</span>
        </span>
        <span class="inline-flex items-center gap-1.5 text-emerald-800">
          <ArrowRightLeft class="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>亮绿：复用且发生变化</span>
        </span>
        <span class="inline-flex items-center gap-1.5 text-rose-800">
          <Trash2 class="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
          <span>红色：销毁节点</span>
        </span>
        <span class="inline-flex items-center gap-1.5 text-slate-500">
          <CheckCircle2 class="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <span>浅灰：复用且无变化</span>
        </span>
      </div>
    </div>

    <!-- 一行四列同排等高网格（桌面端 4 列并排，中等屏幕 2 列，移动端 1 列） -->
    <div class="grid items-stretch gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      <KeyStrategyPanel
        v-for="meta in KEY_STRATEGIES"
        :key="`${meta.id}-${resetCounter}`"
        :meta="meta"
        :users="strategyUsers[meta.id]"
        :operation-seq="operationSeq"
        :operation-label="operationLabel"
        @report="emit('report', $event)"
      />
    </div>
  </section>
</template>

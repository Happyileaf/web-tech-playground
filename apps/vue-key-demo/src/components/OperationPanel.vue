<script setup lang="ts">
import {
  ArrowDownUp,
  ListPlus,
  Pencil,
  RefreshCw,
  RotateCcw,
  Scissors,
  Shuffle,
  Trash,
} from 'lucide-vue-next';
import { CLASSIC_EXPERIMENTS } from '../data/experiments';
import type { ClassicExperiment, ExecutionMode, OperationId } from '../types/experiment';

defineProps<{
  listLength: number;
  executionMode: ExecutionMode;
  isStepInProgress: boolean;
  activeExperimentId: string | null;
  lastOperationLabel: string;
}>();

const emit = defineEmits<{
  operate: [id: OperationId];
  'update:executionMode': [mode: ExecutionMode];
  runExperiment: [experiment: ClassicExperiment];
}>();

const activeExperiment = (id: string | null) =>
  CLASSIC_EXPERIMENTS.find((item) => item.id === id) ?? null;
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
    <!-- 顶部标题与执行模式切换 -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
      <div>
        <h1 class="font-display text-lg font-semibold text-slate-900">
          Vue 3 列表渲染 Key 差异可视化实验台
        </h1>
        <p class="mt-0.5 text-xs text-slate-500">
          一次操作同步作用于四列策略，静默项弱化退后，重点高亮新建、销毁、移动与状态错位。
        </p>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <span class="text-xs font-medium text-slate-500 tabular-nums">
          当前 {{ listLength }} 人 · {{ lastOperationLabel }}
        </span>
        <div class="flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="执行模式选择">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            :class="
              executionMode === 'immediate'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            "
            @click="emit('update:executionMode', 'immediate')"
          >
            即时执行
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            :class="
              executionMode === 'step'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            "
            @click="emit('update:executionMode', 'step')"
          >
            逐步执行
          </button>
        </div>
      </div>
    </div>

    <!-- 统一操作区 + 经典实验快捷条 -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          :disabled="listLength === 0 || isStepInProgress"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="emit('operate', 'delete-first')"
        >
          <Trash class="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
          <span>删除第一项</span>
        </button>

        <button
          type="button"
          :disabled="listLength === 0 || isStepInProgress"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="emit('operate', 'delete-middle')"
        >
          <Scissors class="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
          <span>删除中间项</span>
        </button>

        <button
          type="button"
          :disabled="isStepInProgress"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="emit('operate', 'insert-head')"
        >
          <ListPlus class="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
          <span>头部插入</span>
        </button>

        <button
          type="button"
          :disabled="isStepInProgress"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="emit('operate', 'insert-middle')"
        >
          <ListPlus class="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
          <span>中间插入</span>
        </button>

        <button
          type="button"
          :disabled="listLength < 2 || isStepInProgress"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="emit('operate', 'reverse')"
        >
          <ArrowDownUp class="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
          <span>反转顺序</span>
        </button>

        <button
          type="button"
          :disabled="listLength < 2 || isStepInProgress"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="emit('operate', 'shuffle')"
        >
          <Shuffle class="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
          <span>随机排序</span>
        </button>

        <button
          type="button"
          :disabled="listLength === 0 || isStepInProgress"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="emit('operate', 'modify-data')"
        >
          <Pencil class="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>修改数据</span>
        </button>

        <button
          type="button"
          :disabled="isStepInProgress"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 whitespace-nowrap shrink-0 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          @click="emit('operate', 'parent-rerender')"
        >
          <RefreshCw class="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
          <span>父组件重渲染</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white whitespace-nowrap shrink-0 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          @click="emit('operate', 'reset')"
        >
          <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
          <span>重置</span>
        </button>
      </div>
    </div>

    <!-- 五大经典实验一排快捷入口 -->
    <div class="border-t border-slate-200 pt-3.5 space-y-2.5">
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <button
          v-for="exp in CLASSIC_EXPERIMENTS"
          :key="exp.id"
          type="button"
          :disabled="isStepInProgress"
          class="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          :class="
            activeExperimentId === exp.id
              ? 'border-sky-400 bg-sky-50/75 text-slate-900'
              : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-white'
          "
          @click="emit('runExperiment', exp)"
        >
          <span class="font-semibold text-sky-700 shrink-0">{{ exp.number }}</span>
          <span class="font-semibold text-slate-900 truncate">{{ exp.title }}</span>
        </button>
      </div>

      <div
        v-if="activeExperiment(activeExperimentId)"
        class="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700"
      >
        <span class="font-semibold text-slate-900">
          {{ activeExperiment(activeExperimentId)?.number }} · {{ activeExperiment(activeExperimentId)?.title }}：
        </span>
        <span class="text-slate-600">
          {{ activeExperiment(activeExperimentId)?.focusPoints.join('；') }}
        </span>
      </div>
    </div>
  </section>
</template>

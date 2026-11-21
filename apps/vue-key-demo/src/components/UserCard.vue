<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue';
import { AlertTriangle, ArrowRightLeft, CheckCircle2, Minus, PlusCircle, Tag } from 'lucide-vue-next';
import type { InstanceRecord, UserItem } from '../types/experiment';

const props = defineProps<{
  user: UserItem;
  index: number;
  keyLabel: string;
  operationSeq: number;
  allocateId: () => string;
  registerInstance: (record: InstanceRecord) => void;
  updateInstance: (record: InstanceRecord) => void;
  unregisterInstance: (instanceId: string) => void;
}>();

// 组件实例身份与初始宿主身份：仅在组件挂载创建时捕获一次，绝不随 props 更新而重置
const instanceId = props.allocateId();
const initialOwnerId = props.user.id;
const initialOwnerName = props.user.name;
const mountSeq = props.operationSeq;

// 组件内部局部状态：不绑定外部人员 ID，用于真实暴露错误 key 带来的状态错位或丢失
const remark = ref(`${props.user.name}的备注`);
const updateCount = ref(0);

// 追踪当前操作中真正发生的变化（位置移动、字段修改、或被替换为其他人员）
const lastChangedSeq = ref<number>(0);
const changeDetail = ref<string>('');

watch(
  () => [props.user.id, props.user.name, props.user.age, props.index, props.keyLabel] as const,
  ([newId, newName, newAge, newIdx], [oldId, oldName, oldAge, oldIdx]) => {
    if (newId === oldId && newName === oldName && newAge === oldAge && newIdx === oldIdx) {
      return;
    }

    updateCount.value += 1;
    lastChangedSeq.value = props.operationSeq;

    const tags: string[] = [];
    if (newId !== oldId) {
      tags.push(`宿主变更 ${oldName}→${newName}`);
    } else {
      if (newIdx !== oldIdx) {
        tags.push(`位置 ${oldIdx}→${newIdx}`);
      }
      if (newName !== oldName || newAge !== oldAge) {
        tags.push('字段已更新');
      }
    }
    changeDetail.value = tags.join(' · ') || '属性同步';
  },
  { flush: 'pre' },
);

const isNewlyMounted = computed(() => props.operationSeq > 0 && mountSeq === props.operationSeq);
const isMismatched = computed(() => props.user.id !== initialOwnerId);
const isChangedThisOp = computed(
  () => props.operationSeq > 0 && lastChangedSeq.value === props.operationSeq,
);

const visualState = computed<'initial' | 'created' | 'mismatched' | 'changed' | 'unchanged'>(() => {
  if (props.operationSeq === 0) return 'initial';
  if (isNewlyMounted.value) return 'created';
  if (isMismatched.value) return 'mismatched';
  if (isChangedThisOp.value) return 'changed';
  return 'unchanged';
});

const cardContainerClass = computed(() => {
  switch (visualState.value) {
    case 'created':
      return 'border-sky-400 bg-sky-50/90 ring-1 ring-sky-200';
    case 'mismatched':
      return 'border-amber-400 bg-amber-50/95 ring-1 ring-amber-200';
    case 'changed':
      return 'border-emerald-400 bg-emerald-50/85 ring-1 ring-emerald-200';
    case 'unchanged':
      return 'border-slate-200/90 bg-slate-50/65 opacity-85';
    default:
      return 'border-slate-200 bg-white';
  }
});

const statusTextClass = computed(() => {
  switch (visualState.value) {
    case 'created':
      return 'text-sky-800';
    case 'mismatched':
      return 'text-amber-900';
    case 'changed':
      return 'text-emerald-800';
    case 'unchanged':
      return 'text-slate-500';
    default:
      return 'text-slate-500';
  }
});

const statusLabel = computed(() => {
  switch (visualState.value) {
    case 'created':
      return '新建';
    case 'mismatched':
      return '状态错位';
    case 'changed':
      return '复用·变化';
    case 'unchanged':
      return '复用·未变';
    default:
      return '初始';
  }
});

const diagnosticText = computed(() => {
  if (visualState.value === 'created') return '新挂载组件实例';
  if (visualState.value === 'mismatched') {
    return `原属 ${initialOwnerName}(${initialOwnerId}) ≠ 现 ${props.user.name}`;
  }
  if (visualState.value === 'changed') return changeDetail.value;
  if (visualState.value === 'unchanged') return '身份与位置均无变化';
  return `更新 ${updateCount.value} 次`;
});

const buildRecord = (): InstanceRecord => ({
  instanceId,
  initialOwnerId,
  initialOwnerName,
  currentUserId: props.user.id,
  currentUserName: props.user.name,
  currentIndex: props.index,
  currentKeyLabel: props.keyLabel,
  isNewlyMounted: isNewlyMounted.value,
});

onMounted(() => {
  props.registerInstance(buildRecord());
});

onUpdated(() => {
  props.updateInstance(buildRecord());
});

onUnmounted(() => {
  props.unregisterInstance(instanceId);
});

const appendMarker = () => {
  if (!remark.value.includes('★')) {
    remark.value = `${remark.value} ★`;
  } else {
    remark.value = remark.value.replace(/\s*★/g, '');
  }
};
</script>

<template>
  <div
    class="rounded-lg border px-3 py-2.5 transition-colors duration-150"
    :class="cardContainerClass"
  >
    <!-- 首行：固定高度，对齐人员姓名与实例状态 -->
    <div class="flex h-6 items-center justify-between gap-2">
      <div class="flex items-baseline gap-1.5 min-w-0">
        <span class="font-display text-sm font-semibold text-slate-900 truncate">
          {{ user.name }}
        </span>
        <span class="text-[11px] text-slate-500 tabular-nums whitespace-nowrap shrink-0">
          {{ user.age }}岁 · {{ user.id }}
        </span>
      </div>

      <div class="flex items-center gap-1.5 text-[11px] whitespace-nowrap shrink-0">
        <span class="font-mono font-semibold text-slate-800 tabular-nums">
          {{ instanceId }}
        </span>
        <span class="text-slate-300" aria-hidden="true">·</span>
        <span class="inline-flex items-center gap-1 font-medium" :class="statusTextClass">
          <PlusCircle v-if="visualState === 'created'" class="h-3 w-3" aria-hidden="true" />
          <AlertTriangle
            v-else-if="visualState === 'mismatched'"
            class="h-3 w-3"
            aria-hidden="true"
          />
          <ArrowRightLeft v-else-if="visualState === 'changed'" class="h-3 w-3" aria-hidden="true" />
          <CheckCircle2 v-else-if="visualState === 'unchanged'" class="h-3 w-3 text-emerald-600" aria-hidden="true" />
          <Minus v-else class="h-3 w-3 text-slate-400" aria-hidden="true" />
          <span>{{ statusLabel }}</span>
        </span>
      </div>
    </div>

    <!-- 次行：固定高度，高亮展示真实差异或错位归属 -->
    <div class="mt-1 flex h-5 items-center justify-between gap-2 text-[11px]">
      <div class="font-mono text-slate-500 tabular-nums whitespace-nowrap shrink-0">
        <span>[{{ index }}]</span>
        <span class="mx-1 text-slate-300" aria-hidden="true">/</span>
        <span :class="keyLabel === '未配置' ? 'text-rose-700 font-medium' : 'text-slate-700'">
          key={{ keyLabel }}
        </span>
      </div>

      <div
        class="truncate font-medium"
        :class="
          visualState === 'mismatched'
            ? 'text-amber-900'
            : visualState === 'created'
              ? 'text-sky-800'
              : visualState === 'changed'
                ? 'text-emerald-800'
                : 'text-slate-400'
        "
        :title="diagnosticText"
      >
        {{ diagnosticText }}
      </div>
    </div>

    <!-- 三行：组件内部非受控备注输入框 -->
    <div class="mt-2 flex h-8 items-center gap-1.5">
      <label class="sr-only" :for="`remark-${instanceId}-${keyLabel}`">
        {{ user.name }} 的组件内部备注
      </label>
      <input
        :id="`remark-${instanceId}-${keyLabel}`"
        v-model="remark"
        type="text"
        placeholder="组件内部备注..."
        class="h-full w-full min-w-0 rounded-md border bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        :class="
          visualState === 'mismatched'
            ? 'border-amber-400 text-amber-950 font-medium'
            : visualState === 'created'
              ? 'border-sky-300'
              : 'border-slate-200'
        "
      />
      <button
        type="button"
        title="在组件内部状态中添加或移除 ★ 标记"
        class="inline-flex h-full items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 whitespace-nowrap shrink-0 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        @click="appendMarker"
      >
        <Tag class="h-3 w-3" aria-hidden="true" />
        <span>标记</span>
      </button>
    </div>
  </div>
</template>

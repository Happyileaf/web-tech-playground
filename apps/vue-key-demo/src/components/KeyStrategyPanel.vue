<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { Trash2 } from 'lucide-vue-next';
import UserCard from './UserCard.vue';
import type {
  DestroyedRecord,
  InstanceMapping,
  InstanceRecord,
  StrategyDiffReport,
  StrategyMeta,
  UserItem,
} from '../types/experiment';

const props = defineProps<{
  meta: StrategyMeta;
  users: UserItem[];
  operationSeq: number;
  operationLabel: string;
}>();

const emit = defineEmits<{
  report: [payload: StrategyDiffReport];
}>();

// 实例编号生成器：DOM-A, DOM-B, ..., DOM-Z, DOM-AA ...
let instanceCounter = 0;
const allocateId = (): string => {
  const n = instanceCounter++;
  if (n < 26) {
    return `DOM-${String.fromCharCode(65 + n)}`;
  }
  const prefix = String.fromCharCode(65 + Math.floor(n / 26) - 1);
  const suffix = String.fromCharCode(65 + (n % 26));
  return `DOM-${prefix}${suffix}`;
};

const createRandomKey = (): string => {
  return `rnd_${Math.random().toString(36).slice(2, 7)}`;
};

const unstableKeys = ref<string[]>(props.users.map(() => createRandomKey()));

const activeInstances = new Map<string, InstanceRecord>();
let beforeSnapshot: InstanceMapping[] = [];
let pendingMounted: InstanceRecord[] = [];
let pendingUnmounted: DestroyedRecord[] = [];

const latestStats = ref({
  reusedCount: props.users.length,
  createdCount: 0,
  destroyedCount: 0,
  mismatchCount: 0,
});
const lastDestroyed = ref<DestroyedRecord[]>([]);

// 突出展示本列真正发生的变化焦点
const changeHeadline = computed(() => {
  if (props.operationSeq === 0) {
    return {
      tone: 'neutral' as const,
      text: '初始状态 · 等待操作对比',
    };
  }
  const { reusedCount, createdCount, destroyedCount, mismatchCount } = latestStats.value;
  if (mismatchCount > 0) {
    return {
      tone: 'amber' as const,
      text: `${mismatchCount} 项状态错位${destroyedCount > 0 ? ` · ${destroyedCount} 项销毁` : ''}${createdCount > 0 ? ` · ${createdCount} 项新建` : ''}`,
    };
  }
  if (createdCount > 0 && destroyedCount > 0 && reusedCount === 0) {
    return {
      tone: 'rose' as const,
      text: `整批重建：销毁 ${destroyedCount} 项 · 新建 ${createdCount} 项（状态丢失）`,
    };
  }
  if (createdCount === 0 && destroyedCount === 0) {
    return {
      tone: 'emerald' as const,
      text: `全部 ${reusedCount} 项精准复用 · 0 销毁 · 0 错位`,
    };
  }
  return {
    tone: 'sky' as const,
    text: `复用 ${reusedCount} · 新建 ${createdCount} · 销毁 ${destroyedCount} · 0 错位`,
  };
});

const toSortedMappings = (records: Iterable<InstanceRecord>): InstanceMapping[] => {
  return Array.from(records)
    .sort((a, b) => a.currentIndex - b.currentIndex)
    .map((item) => ({
      instanceId: item.instanceId,
      userId: item.currentUserId,
      userName: item.currentUserName,
      index: item.currentIndex,
      keyLabel: item.currentKeyLabel,
      initialOwnerId: item.initialOwnerId,
      initialOwnerName: item.initialOwnerName,
      isNewlyMounted: item.isNewlyMounted,
      isMismatched: item.currentUserId !== item.initialOwnerId,
    }));
};

const registerInstance = (record: InstanceRecord) => {
  activeInstances.set(record.instanceId, record);
  if (props.operationSeq > 0) {
    pendingMounted.push(record);
  }
};

const updateInstance = (record: InstanceRecord) => {
  activeInstances.set(record.instanceId, record);
};

const unregisterInstance = (instanceId: string) => {
  const existing = activeInstances.get(instanceId);
  if (existing) {
    pendingUnmounted.push({
      instanceId: existing.instanceId,
      userId: existing.currentUserId,
      userName: existing.currentUserName,
      initialOwnerName: existing.initialOwnerName,
    });
    activeInstances.delete(instanceId);
  }
};

watch(
  () => props.operationSeq,
  () => {
    beforeSnapshot = toSortedMappings(activeInstances.values());
    pendingMounted = [];
    pendingUnmounted = [];

    if (props.meta.id === 'unstable-key') {
      unstableKeys.value = props.users.map(() => createRandomKey());
    }
  },
  { flush: 'sync' },
);

const emitCurrentReport = (seq: number, label: string) => {
  const mountedSet = new Set(pendingMounted.map((item) => item.instanceId));
  const afterMappings = toSortedMappings(activeInstances.values()).map((item) => ({
    ...item,
    isNewlyMounted: seq > 0 && mountedSet.has(item.instanceId),
  }));

  const reusedCount = seq === 0 ? afterMappings.length : afterMappings.filter((i) => !i.isNewlyMounted).length;
  const createdCount = seq === 0 ? 0 : pendingMounted.length;
  const destroyedCount = seq === 0 ? 0 : pendingUnmounted.length;
  const mismatchCount = afterMappings.filter((i) => i.isMismatched).length;

  latestStats.value = {
    reusedCount,
    createdCount,
    destroyedCount,
    mismatchCount,
  };
  lastDestroyed.value = seq === 0 ? [] : [...pendingUnmounted];

  emit('report', {
    strategy: props.meta.id,
    operationSeq: seq,
    operationLabel: label,
    reusedCount,
    createdCount,
    destroyedCount,
    mismatchCount,
    beforeMappings: seq === 0 ? afterMappings : beforeSnapshot,
    afterMappings,
    destroyedRecords: seq === 0 ? [] : [...pendingUnmounted],
  });
};

watch(
  () => props.operationSeq,
  async (newSeq) => {
    await nextTick();
    emitCurrentReport(newSeq, props.operationLabel);
  },
  { flush: 'post' },
);

onMounted(async () => {
  await nextTick();
  emitCurrentReport(props.operationSeq, '初始挂载');
});
</script>

<template>
  <section class="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
    <!-- 统一固定结构头部，保证四列完全等高对齐 -->
    <header class="shrink-0 border-b border-slate-200 p-4 space-y-2.5">
      <div class="space-y-1.5">
        <h3 class="font-display text-sm font-semibold text-slate-900 truncate" :title="meta.title">
          <span class="font-mono text-sky-700 mr-1">{{ meta.orderLabel }}.</span>
          <span>{{ meta.title }}</span>
        </h3>

        <div class="flex items-center justify-between gap-2 text-xs font-medium tabular-nums whitespace-nowrap">
          <span class="text-emerald-700">复用 {{ latestStats.reusedCount }}</span>
          <span class="text-slate-300" aria-hidden="true">/</span>
          <span class="text-sky-700">新建 {{ latestStats.createdCount }}</span>
          <span class="text-slate-300" aria-hidden="true">/</span>
          <span class="text-rose-700">销毁 {{ latestStats.destroyedCount }}</span>
          <span class="text-slate-300" aria-hidden="true">/</span>
          <span :class="latestStats.mismatchCount > 0 ? 'text-amber-800 font-semibold' : 'text-slate-500'">
            错位 {{ latestStats.mismatchCount }}
          </span>
        </div>
      </div>

      <!-- 完整多行模板代码区（等高展开，顶对齐不偏移） -->
      <pre class="h-[7.75rem] rounded-md bg-slate-900 px-3 py-3 font-mono text-xs leading-5 text-slate-100 overflow-x-auto"><code>{{ meta.templateCode }}</code></pre>

      <!-- 固定两行高度的机制摘要 -->
      <p class="min-h-[2.25rem] line-clamp-2 text-[11px] leading-relaxed text-slate-500">
        {{ meta.mechanismSummary }}
      </p>

      <!-- 变化焦点高亮条 -->
      <div
        class="flex min-h-[1.875rem] items-center rounded-md border px-2.5 py-1 text-[11px] font-medium"
        :class="
          changeHeadline.tone === 'amber'
            ? 'border-amber-300 bg-amber-50 text-amber-900'
            : changeHeadline.tone === 'rose'
              ? 'border-rose-300 bg-rose-50 text-rose-800'
              : changeHeadline.tone === 'emerald'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : changeHeadline.tone === 'sky'
                  ? 'border-sky-300 bg-sky-50 text-sky-800'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
        "
      >
        <span class="truncate">{{ changeHeadline.text }}</span>
      </div>
    </header>

    <!-- 真实渲染的人员列表区域（四列纵向严格对齐） -->
    <div class="flex-1 space-y-2.5 p-4">
      <div
        v-if="users.length === 0"
        class="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 px-3 text-center text-xs text-slate-500"
      >
        列表为空，可插入人员或重置
      </div>

      <template v-if="meta.id === 'no-key'">
        <UserCard
          v-for="(user, index) in users"
          :user="user"
          :index="index"
          key-label="未配置"
          :operation-seq="operationSeq"
          :allocate-id="allocateId"
          :register-instance="registerInstance"
          :update-instance="updateInstance"
          :unregister-instance="unregisterInstance"
        />
      </template>

      <template v-else-if="meta.id === 'index-key'">
        <UserCard
          v-for="(user, index) in users"
          :key="index"
          :user="user"
          :index="index"
          :key-label="String(index)"
          :operation-seq="operationSeq"
          :allocate-id="allocateId"
          :register-instance="registerInstance"
          :update-instance="updateInstance"
          :unregister-instance="unregisterInstance"
        />
      </template>

      <template v-else-if="meta.id === 'unstable-key'">
        <UserCard
          v-for="(user, index) in users"
          :key="unstableKeys[index]"
          :user="user"
          :index="index"
          :key-label="unstableKeys[index] ?? ''"
          :operation-seq="operationSeq"
          :allocate-id="allocateId"
          :register-instance="registerInstance"
          :update-instance="updateInstance"
          :unregister-instance="unregisterInstance"
        />
      </template>

      <template v-else>
        <UserCard
          v-for="(user, index) in users"
          :key="user.id"
          :user="user"
          :index="index"
          :key-label="String(user.id)"
          :operation-seq="operationSeq"
          :allocate-id="allocateId"
          :register-instance="registerInstance"
          :update-instance="updateInstance"
          :unregister-instance="unregisterInstance"
        />
      </template>
    </div>

    <!-- 固定底栏：始终保留等高卸载区，确保四列底边平齐 -->
    <footer
      class="shrink-0 min-h-[3.25rem] flex items-center border-t px-4 py-2.5 text-[11px] rounded-b-xl transition-colors"
      :class="
        lastDestroyed.length > 0
          ? 'border-rose-200 bg-rose-50/80 text-rose-800'
          : 'border-slate-200 bg-slate-50/60 text-slate-400'
      "
    >
      <div v-if="lastDestroyed.length > 0" class="flex items-start gap-1.5 leading-snug">
        <Trash2 class="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-700" aria-hidden="true" />
        <div>
          <span class="font-semibold">销毁：</span>
          <span class="font-mono">
            {{
              lastDestroyed
                .map((d) => `${d.instanceId}(${d.userName})`)
                .join('、')
            }}
          </span>
        </div>
      </div>
      <div v-else class="flex items-center gap-1.5">
        <Trash2 class="h-3.5 w-3.5 text-slate-300 shrink-0" aria-hidden="true" />
        <span>本次无销毁实例</span>
      </div>
    </footer>
  </section>
</template>

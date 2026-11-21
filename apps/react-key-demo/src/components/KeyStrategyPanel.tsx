import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import UserCard from './UserCard';
import type {
  DestroyedRecord,
  InstanceMapping,
  InstanceRecord,
  StrategyDiffReport,
  StrategyMeta,
  UserItem,
} from '../types/experiment';

interface KeyStrategyPanelProps {
  meta: StrategyMeta;
  users: UserItem[];
  operationSeq: number;
  operationLabel: string;
  onReport: (payload: StrategyDiffReport) => void;
}

const createRandomKey = () => `rnd_${Math.random().toString(36).slice(2, 7)}`;

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

export default function KeyStrategyPanel({
  meta,
  users,
  operationSeq,
  operationLabel,
  onReport,
}: KeyStrategyPanelProps) {
  const instanceCounterRef = useRef(0);
  const activeInstancesRef = useRef(new Map<string, InstanceRecord>());
  const beforeSnapshotRef = useRef<InstanceMapping[]>([]);
  const pendingMountedRef = useRef<InstanceRecord[]>([]);
  const pendingUnmountedRef = useRef<DestroyedRecord[]>([]);
  const lastPrepSeqRef = useRef(-1);
  const currentOpSeqRef = useRef(operationSeq);
  currentOpSeqRef.current = operationSeq;

  const [latestStats, setLatestStats] = useState({
    reusedCount: users.length,
    createdCount: 0,
    destroyedCount: 0,
    mismatchCount: 0,
  });
  const [lastDestroyed, setLastDestroyed] = useState<DestroyedRecord[]>([]);

  // 每次父级发起新操作时，在 commit 之前先快照旧实例映射并清空增量桶
  if (lastPrepSeqRef.current !== operationSeq) {
    beforeSnapshotRef.current = toSortedMappings(activeInstancesRef.current.values());
    pendingMountedRef.current = [];
    pendingUnmountedRef.current = [];
    lastPrepSeqRef.current = operationSeq;
  }

  // 仅当 operationSeq 或 users 变更时为 unstable-key 生成新随机值，避免本地 stats 更新触发死循环
  const unstableKeys = useMemo(() => {
    if (meta.id !== 'unstable-key') return [];
    return users.map(() => createRandomKey());
  }, [meta.id, operationSeq, users]);

  const allocateId = useCallback((): string => {
    const n = instanceCounterRef.current++;
    if (n < 26) {
      return `DOM-${String.fromCharCode(65 + n)}`;
    }
    const prefix = String.fromCharCode(65 + Math.floor(n / 26) - 1);
    const suffix = String.fromCharCode(65 + (n % 26));
    return `DOM-${prefix}${suffix}`;
  }, []);

  const registerInstance = useCallback((record: InstanceRecord) => {
    activeInstancesRef.current.set(record.instanceId, record);
    if (currentOpSeqRef.current > 0) {
      pendingMountedRef.current.push(record);
    }
  }, []);

  const updateInstance = useCallback((record: InstanceRecord) => {
    activeInstancesRef.current.set(record.instanceId, record);
  }, []);

  const unregisterInstance = useCallback((instanceId: string) => {
    const existing = activeInstancesRef.current.get(instanceId);
    if (existing) {
      pendingUnmountedRef.current.push({
        instanceId: existing.instanceId,
        userId: existing.currentUserId,
        userName: existing.currentUserName,
        initialOwnerName: existing.initialOwnerName,
      });
      activeInstancesRef.current.delete(instanceId);
    }
  }, []);

  // React 子组件的所有 mount/update/cleanup 均已在此 effect 执行前完成
  useEffect(() => {
    const mountedSet = new Set(pendingMountedRef.current.map((item) => item.instanceId));
    const afterMappings = toSortedMappings(activeInstancesRef.current.values()).map((item) => ({
      ...item,
      isNewlyMounted: operationSeq > 0 && mountedSet.has(item.instanceId),
    }));

    const reusedCount =
      operationSeq === 0
        ? afterMappings.length
        : afterMappings.filter((item) => !item.isNewlyMounted).length;
    const createdCount = operationSeq === 0 ? 0 : pendingMountedRef.current.length;
    const destroyedCount = operationSeq === 0 ? 0 : pendingUnmountedRef.current.length;
    const mismatchCount = afterMappings.filter((item) => item.isMismatched).length;

    setLatestStats({
      reusedCount,
      createdCount,
      destroyedCount,
      mismatchCount,
    });
    setLastDestroyed(operationSeq === 0 ? [] : [...pendingUnmountedRef.current]);

    onReport({
      strategy: meta.id,
      operationSeq,
      operationLabel: operationSeq === 0 ? '初始挂载' : operationLabel,
      reusedCount,
      createdCount,
      destroyedCount,
      mismatchCount,
      beforeMappings: operationSeq === 0 ? afterMappings : beforeSnapshotRef.current,
      afterMappings,
      destroyedRecords: operationSeq === 0 ? [] : [...pendingUnmountedRef.current],
    });
  }, [meta.id, onReport, operationLabel, operationSeq]);

  const changeHeadline = useMemo(() => {
    if (operationSeq === 0) {
      return {
        tone: 'neutral' as const,
        text: '初始状态 · 等待操作对比',
      };
    }
    const { reusedCount, createdCount, destroyedCount, mismatchCount } = latestStats;
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
  }, [latestStats, operationSeq]);

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
      {/* 统一固定结构头部，保证四列完全等高对齐 */}
      <header className="shrink-0 border-b border-slate-200 p-4 space-y-2.5">
        <div className="space-y-1.5">
          <h3 className="font-display text-sm font-semibold text-slate-900 truncate" title={meta.title}>
            <span className="font-mono text-sky-700 mr-1">{meta.orderLabel}.</span>
            <span>{meta.title}</span>
          </h3>

          <div className="flex items-center justify-between gap-2 text-xs font-medium tabular-nums whitespace-nowrap">
            <span className="text-emerald-700">复用 {latestStats.reusedCount}</span>
            <span className="text-slate-300" aria-hidden="true">
              /
            </span>
            <span className="text-sky-700">新建 {latestStats.createdCount}</span>
            <span className="text-slate-300" aria-hidden="true">
              /
            </span>
            <span className="text-rose-700">销毁 {latestStats.destroyedCount}</span>
            <span className="text-slate-300" aria-hidden="true">
              /
            </span>
            <span className={latestStats.mismatchCount > 0 ? 'text-amber-800 font-semibold' : 'text-slate-500'}>
              错位 {latestStats.mismatchCount}
            </span>
          </div>
        </div>

        {/* 完整多行模板代码区（等高展开，顶对齐不偏移） */}
        <pre className="h-[7.75rem] rounded-md bg-slate-900 px-3 py-3 font-mono text-xs leading-5 text-slate-100 overflow-x-auto">
          <code>{meta.templateCode}</code>
        </pre>

        {/* 固定两行高度的机制摘要 */}
        <p className="min-h-[2.25rem] line-clamp-2 text-[11px] leading-relaxed text-slate-500">
          {meta.mechanismSummary}
        </p>

        {/* 变化焦点高亮条 */}
        <div
          className={`flex min-h-[1.875rem] items-center rounded-md border px-2.5 py-1 text-[11px] font-medium ${
            changeHeadline.tone === 'amber'
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : changeHeadline.tone === 'rose'
                ? 'border-rose-300 bg-rose-50 text-rose-800'
                : changeHeadline.tone === 'emerald'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : changeHeadline.tone === 'sky'
                    ? 'border-sky-300 bg-sky-50 text-sky-800'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          <span className="truncate">{changeHeadline.text}</span>
        </div>
      </header>

      {/* 真实渲染的人员列表区域 */}
      <div className="flex-1 space-y-2.5 p-4">
        {users.length === 0 && (
          <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 px-3 text-center text-xs text-slate-500">
            列表为空，可插入人员或重置
          </div>
        )}

        {/* 策略一：真实未配置 key */}
        {meta.id === 'no-key' &&
          users.map((user, index) => (
            <UserCard
              user={user}
              index={index}
              keyLabel="未配置"
              operationSeq={operationSeq}
              allocateId={allocateId}
              registerInstance={registerInstance}
              updateInstance={updateInstance}
              unregisterInstance={unregisterInstance}
            />
          ))}

        {/* 策略二：使用 index 作为 key */}
        {meta.id === 'index-key' &&
          users.map((user, index) => (
            <UserCard
              key={index}
              user={user}
              index={index}
              keyLabel={String(index)}
              operationSeq={operationSeq}
              allocateId={allocateId}
              registerInstance={registerInstance}
              updateInstance={updateInstance}
              unregisterInstance={unregisterInstance}
            />
          ))}

        {/* 策略三：使用唯一但不稳定的值作为 key */}
        {meta.id === 'unstable-key' &&
          users.map((user, index) => (
            <UserCard
              key={unstableKeys[index]}
              user={user}
              index={index}
              keyLabel={unstableKeys[index] ?? ''}
              operationSeq={operationSeq}
              allocateId={allocateId}
              registerInstance={registerInstance}
              updateInstance={updateInstance}
              unregisterInstance={unregisterInstance}
            />
          ))}

        {/* 策略四：使用唯一且稳定的 ID 作为 key */}
        {meta.id === 'stable-key' &&
          users.map((user, index) => (
            <UserCard
              key={user.id}
              user={user}
              index={index}
              keyLabel={String(user.id)}
              operationSeq={operationSeq}
              allocateId={allocateId}
              registerInstance={registerInstance}
              updateInstance={updateInstance}
              unregisterInstance={unregisterInstance}
            />
          ))}
      </div>

      {/* 固定底栏：始终保留等高卸载区，确保四列底边平齐 */}
      <footer
        className={`shrink-0 min-h-[3.25rem] flex items-center border-t px-4 py-2.5 text-[11px] rounded-b-xl transition-colors ${
          lastDestroyed.length > 0
            ? 'border-rose-200 bg-rose-50/80 text-rose-800'
            : 'border-slate-200 bg-slate-50/60 text-slate-400'
        }`}
      >
        {lastDestroyed.length > 0 ? (
          <div className="flex items-start gap-1.5 leading-snug">
            <Trash2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-700" aria-hidden="true" />
            <div>
              <span className="font-semibold">销毁：</span>
              <span className="font-mono">
                {lastDestroyed.map((d) => `${d.instanceId}(${d.userName})`).join('、')}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Trash2 className="h-3.5 w-3.5 text-slate-300 shrink-0" aria-hidden="true" />
            <span>本次无销毁实例</span>
          </div>
        )}
      </footer>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRightLeft, CheckCircle2, Minus, PlusCircle, Tag } from 'lucide-react';
import type { InstanceRecord, UserItem } from '../types/experiment';

interface UserCardProps {
  user: UserItem;
  index: number;
  keyLabel: string;
  operationSeq: number;
  allocateId: () => string;
  registerInstance: (record: InstanceRecord) => void;
  updateInstance: (record: InstanceRecord) => void;
  unregisterInstance: (instanceId: string) => void;
}

export default function UserCard({
  user,
  index,
  keyLabel,
  operationSeq,
  allocateId,
  registerInstance,
  updateInstance,
  unregisterInstance,
}: UserCardProps) {
  // 组件实例身份与初始宿主身份：仅在首次挂载创建 Fiber 实例时捕获一次，不随 props 变化而重置
  const instanceIdRef = useRef<string | null>(null);
  if (instanceIdRef.current === null) {
    instanceIdRef.current = allocateId();
  }
  const instanceId = instanceIdRef.current;

  const initialOwnerIdRef = useRef(user.id);
  const initialOwnerNameRef = useRef(user.name);
  const mountSeqRef = useRef(operationSeq);

  const initialOwnerId = initialOwnerIdRef.current;
  const initialOwnerName = initialOwnerNameRef.current;
  const mountSeq = mountSeqRef.current;

  // 组件内部局部状态：不绑定外部人员 ID，用于真实暴露错误 key 带来的状态错位或丢失
  const [remark, setRemark] = useState(() => `${user.name}的备注`);

  // 追踪本次操作是否真实发生位置移动、字段更新或宿主替换（忽略纯对象引用刷新）
  const prevPropsRef = useRef({
    id: user.id,
    name: user.name,
    age: user.age,
    index,
  });
  const updateCountRef = useRef(0);
  const changeStateRef = useRef({ seq: 0, detail: '' });

  if (
    prevPropsRef.current.id !== user.id ||
    prevPropsRef.current.name !== user.name ||
    prevPropsRef.current.age !== user.age ||
    prevPropsRef.current.index !== index
  ) {
    const tags: string[] = [];
    if (prevPropsRef.current.id !== user.id) {
      tags.push(`宿主变更 ${prevPropsRef.current.name}→${user.name}`);
    } else {
      if (prevPropsRef.current.index !== index) {
        tags.push(`位置 ${prevPropsRef.current.index}→${index}`);
      }
      if (prevPropsRef.current.name !== user.name || prevPropsRef.current.age !== user.age) {
        tags.push('字段已更新');
      }
    }
    updateCountRef.current += 1;
    changeStateRef.current = {
      seq: operationSeq,
      detail: tags.join(' · ') || '属性同步',
    };
    prevPropsRef.current = {
      id: user.id,
      name: user.name,
      age: user.age,
      index,
    };
  }

  const isNewlyMounted = operationSeq > 0 && mountSeq === operationSeq;
  const isMismatched = user.id !== initialOwnerId;
  const isChangedThisOp = operationSeq > 0 && changeStateRef.current.seq === operationSeq;

  const latestRecordRef = useRef<InstanceRecord>({
    instanceId,
    initialOwnerId,
    initialOwnerName,
    currentUserId: user.id,
    currentUserName: user.name,
    currentIndex: index,
    currentKeyLabel: keyLabel,
    isNewlyMounted,
  });

  latestRecordRef.current = {
    instanceId,
    initialOwnerId,
    initialOwnerName,
    currentUserId: user.id,
    currentUserName: user.name,
    currentIndex: index,
    currentKeyLabel: keyLabel,
    isNewlyMounted,
  };

  useEffect(() => {
    registerInstance(latestRecordRef.current);
    return () => {
      unregisterInstance(instanceId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateInstance(latestRecordRef.current);
  });

  const visualState: 'initial' | 'created' | 'mismatched' | 'changed' | 'unchanged' =
    operationSeq === 0
      ? 'initial'
      : isNewlyMounted
        ? 'created'
        : isMismatched
          ? 'mismatched'
          : isChangedThisOp
            ? 'changed'
            : 'unchanged';

  const cardContainerClass =
    visualState === 'created'
      ? 'border-sky-400 bg-sky-50/90 ring-1 ring-sky-200'
      : visualState === 'mismatched'
        ? 'border-amber-400 bg-amber-50/95 ring-1 ring-amber-200'
        : visualState === 'changed'
          ? 'border-emerald-400 bg-emerald-50/85 ring-1 ring-emerald-200'
          : visualState === 'unchanged'
            ? 'border-slate-200/90 bg-slate-50/65 opacity-85'
            : 'border-slate-200 bg-white';

  const statusTextClass =
    visualState === 'created'
      ? 'text-sky-800'
      : visualState === 'mismatched'
        ? 'text-amber-900'
        : visualState === 'changed'
          ? 'text-emerald-800'
          : 'text-slate-500';

  const statusLabel =
    visualState === 'created'
      ? '新建'
      : visualState === 'mismatched'
        ? '状态错位'
        : visualState === 'changed'
          ? '复用·变化'
          : visualState === 'unchanged'
            ? '复用·未变'
            : '初始';

  const diagnosticText =
    visualState === 'created'
      ? '新挂载组件实例'
      : visualState === 'mismatched'
        ? `原属 ${initialOwnerName}(${initialOwnerId}) ≠ 现 ${user.name}`
        : visualState === 'changed'
          ? changeStateRef.current.detail
          : visualState === 'unchanged'
            ? '身份与位置均无变化'
            : `更新 ${updateCountRef.current} 次`;

  const appendMarker = () => {
    setRemark((prev) => (prev.includes('★') ? prev.replace(/\s*★/g, '') : `${prev} ★`));
  };

  return (
    <div className={`rounded-lg border px-3 py-2.5 transition-colors duration-150 ${cardContainerClass}`}>
      {/* 首行：固定高度，对齐人员姓名与实例状态 */}
      <div className="flex h-6 items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="font-display text-sm font-semibold text-slate-900 truncate">
            {user.name}
          </span>
          <span className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap shrink-0">
            {user.age}岁 · {user.id}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap shrink-0">
          <span className="font-mono font-semibold text-slate-800 tabular-nums">{instanceId}</span>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <span className={`inline-flex items-center gap-1 font-medium ${statusTextClass}`}>
            {visualState === 'created' && <PlusCircle className="h-3 w-3" aria-hidden="true" />}
            {visualState === 'mismatched' && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
            {visualState === 'changed' && <ArrowRightLeft className="h-3 w-3" aria-hidden="true" />}
            {visualState === 'unchanged' && (
              <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
            )}
            {visualState === 'initial' && <Minus className="h-3 w-3 text-slate-400" aria-hidden="true" />}
            <span>{statusLabel}</span>
          </span>
        </div>
      </div>

      {/* 次行：固定高度，高亮展示真实差异或错位归属 */}
      <div className="mt-1 flex h-5 items-center justify-between gap-2 text-[11px]">
        <div className="font-mono text-slate-500 tabular-nums whitespace-nowrap shrink-0">
          <span>[{index}]</span>
          <span className="mx-1 text-slate-300" aria-hidden="true">
            /
          </span>
          <span className={keyLabel === '未配置' ? 'text-rose-700 font-medium' : 'text-slate-700'}>
            key={keyLabel}
          </span>
        </div>

        <div
          className={`truncate font-medium ${
            visualState === 'mismatched'
              ? 'text-amber-900'
              : visualState === 'created'
                ? 'text-sky-800'
                : visualState === 'changed'
                  ? 'text-emerald-800'
                  : 'text-slate-400'
          }`}
          title={diagnosticText}
        >
          {diagnosticText}
        </div>
      </div>

      {/* 三行：组件内部非受控 useState 备注输入框 */}
      <div className="mt-2 flex h-8 items-center gap-1.5">
        <label className="sr-only" htmlFor={`remark-${instanceId}-${keyLabel}`}>
          {user.name} 的组件内部备注
        </label>
        <input
          id={`remark-${instanceId}-${keyLabel}`}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          type="text"
          placeholder="组件内部备注..."
          className={`h-full w-full min-w-0 rounded-md border bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${
            visualState === 'mismatched'
              ? 'border-amber-400 text-amber-950 font-medium'
              : visualState === 'created'
                ? 'border-sky-300'
                : 'border-slate-200'
          }`}
        />
        <button
          type="button"
          title="在组件内部状态中添加或移除 ★ 标记"
          className="inline-flex h-full items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 whitespace-nowrap shrink-0 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          onClick={appendMarker}
        >
          <Tag className="h-3 w-3" aria-hidden="true" />
          <span>标记</span>
        </button>
      </div>
    </div>
  );
}

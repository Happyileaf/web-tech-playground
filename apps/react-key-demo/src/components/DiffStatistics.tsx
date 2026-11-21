import { KEY_STRATEGIES } from '../data/experiments';
import type { InstanceMapping, KeyStrategyId, StrategyDiffReport } from '../types/experiment';

interface DiffStatisticsProps {
  historyLogs: Array<{
    seq: number;
    operationLabel: string;
    reports: Record<KeyStrategyId, StrategyDiffReport>;
  }>;
}

interface HighlightDeltaItem {
  kind: 'mismatch' | 'created' | 'destroyed' | 'moved' | 'updated';
  label: string;
  detail: string;
}

const extractChangedItems = (
  report: StrategyDiffReport,
): {
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

export default function DiffStatistics({ historyLogs }: DiffStatisticsProps) {
  const latestLog = historyLogs[0] ?? null;

  const changeColumns = latestLog
    ? KEY_STRATEGIES.map((meta) => {
        const report = latestLog.reports[meta.id];
        return {
          meta,
          report,
          ...extractChangedItems(report),
        };
      })
    : [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            本次操作真实变化焦点
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            仅突出显示真实发生创建、销毁、移动、字段更新或状态错位的实例，未受影响节点自动折叠。
          </p>
        </div>
        {latestLog && (
          <span className="font-mono text-xs text-slate-600 tabular-nums">
            第 {latestLog.seq} 次操作 · {latestLog.operationLabel}
          </span>
        )}
      </div>

      {!latestLog ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500">
          执行任意列表操作或点击经典实验后，此处将按四列对照展示本次真正发生变化与错位的组件实例。
        </div>
      ) : (
        <div className="grid items-stretch gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {changeColumns.map((col) => (
            <article
              key={col.meta.id}
              className="flex h-full flex-col rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-900">
                  {col.meta.orderLabel}. {col.meta.shortTitle}
                </span>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  {col.deltas.length} 项变化
                </span>
              </div>

              <ul className="mt-2.5 flex-1 space-y-1.5 font-mono text-[11px]">
                {col.deltas.map((delta, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center justify-between gap-2 rounded border px-2 py-1 ${
                      delta.kind === 'mismatch'
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : delta.kind === 'created'
                          ? 'border-sky-200 bg-sky-50 text-sky-900'
                          : delta.kind === 'destroyed'
                            ? 'border-rose-200 bg-rose-50 text-rose-800'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    }`}
                  >
                    <span className="font-semibold shrink-0">{delta.label}</span>
                    <span className="truncate text-right">{delta.detail}</span>
                  </li>
                ))}

                {col.deltas.length === 0 && (
                  <li className="rounded border border-slate-200 bg-white px-2 py-2 text-center font-sans text-slate-500">
                    所有实例原位复用，无结构或身份变化
                  </li>
                )}
              </ul>

              <div className="mt-2.5 border-t border-slate-200 pt-2 text-[11px] text-slate-400 tabular-nums">
                未变化静默复用：{col.unchangedCount} 个实例
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

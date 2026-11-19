import { nextTick, ref } from "vue";

const INITIAL_ITEMS = [
  { id: 1, name: "列表项 Alpha" },
  { id: 2, name: "列表项 Bravo" },
  { id: 3, name: "列表项 Charlie" },
  { id: 4, name: "列表项 Delta" },
];

const INITIAL_COUNTER = 4;

function createEmptyCounters() {
  return {
    index: { mounted: 0, unmounted: 0, totalMounted: 0 },
    id: { mounted: 0, unmounted: 0, totalMounted: 0 },
  };
}

function formatTime(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}.${String(date.getMilliseconds()).padStart(3, "0")}`;
}

export function useExperiment() {
  const items = ref(INITIAL_ITEMS.map((item) => ({ ...item })));
  const logs = ref([]);
  // 重置时变化，作为列表容器 key，强制两个实验区整体重建，清空项内本地状态
  const resetVersion = ref(0);

  let idCounter = INITIAL_COUNTER;
  // setup 阶段即开始统计，确保子组件首次 onMounted（早于父组件 onMounted）也能计入
  let pendingCounters = createEmptyCounters();

  function createItem() {
    idCounter += 1;
    return { id: idCounter, name: `列表项 Item-${idCounter}` };
  }

  function reportLifecycle(strategy, type) {
    if (!pendingCounters) return;
    const counter = pendingCounters[strategy];
    counter[type] += 1;
    if (type === "mounted") {
      counter.totalMounted += 1;
    }
  }

  function snapshotCounters(name) {
    // 重置等场景下可能已被其他流程快照，避免对 null 解引用
    if (!pendingCounters) return;
    const counters = pendingCounters;
    pendingCounters = null;
    logs.value.push({
      id: logs.value.length + 1,
      name,
      time: formatTime(new Date()),
      index: { ...counters.index },
      id: { ...counters.id },
    });
  }

  async function runOperation(name, mutate) {
    pendingCounters = createEmptyCounters();
    mutate();
    await nextTick();
    snapshotCounters(name);
  }

  function insertAtHead() {
    return runOperation("头部插入", () => {
      items.value.unshift(createItem());
    });
  }

  function insertAtTail() {
    return runOperation("尾部插入", () => {
      items.value.push(createItem());
    });
  }

  function insertAtRandom() {
    return runOperation("随机位置插入", () => {
      const position = Math.floor(Math.random() * (items.value.length + 1));
      items.value.splice(position, 0, createItem());
    });
  }

  function removeItem(id) {
    return runOperation(`删除 id=${id} 的项`, () => {
      const index = items.value.findIndex((item) => item.id === id);
      if (index !== -1) {
        items.value.splice(index, 1);
      }
    });
  }

  function reverseItems() {
    return runOperation("反转顺序", () => {
      items.value.reverse();
    });
  }

  function shuffleItems() {
    return runOperation("随机洗牌", () => {
      const list = items.value;
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    });
  }

  function reset() {
    return runOperation("重置（重新初始渲染）", () => {
      idCounter = INITIAL_COUNTER;
      items.value = INITIAL_ITEMS.map((item) => ({ ...item }));
      logs.value = [];
      resetVersion.value += 1;
    });
  }

  function clearLogs() {
    logs.value = [];
  }

  function recordInitialRender() {
    nextTick(() => {
      snapshotCounters("初始渲染");
    });
  }

  return {
    items,
    logs,
    resetVersion,
    reportLifecycle,
    recordInitialRender,
    insertAtHead,
    insertAtTail,
    insertAtRandom,
    removeItem,
    reverseItems,
    shuffleItems,
    reset,
    clearLogs,
  };
}

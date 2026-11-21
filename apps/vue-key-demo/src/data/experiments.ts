import type { ClassicExperiment, KeyStrategyId, StrategyMeta, UserItem } from '../types/experiment';

export const INITIAL_USERS: UserItem[] = [
  { id: 101, name: '张三', age: 25 },
  { id: 102, name: '李四', age: 26 },
  { id: 103, name: '王五', age: 27 },
  { id: 104, name: '赵六', age: 28 },
];

export const NEW_USER_POOL: Array<{ name: string; age: number }> = [
  { name: '陈七', age: 24 },
  { name: '周八', age: 29 },
  { name: '吴九', age: 23 },
  { name: '郑十', age: 30 },
  { name: '孙十一', age: 22 },
  { name: '钱十二', age: 31 },
];

export const KEY_STRATEGIES: StrategyMeta[] = [
  {
    id: 'no-key',
    orderLabel: '01',
    title: '未配置 key',
    shortTitle: '无 key',
    templateCode: `<UserCard
  v-for="user in users"
  :user="user"
/>`,
    mechanismSummary: 'Vue 走 patchUnkeyedChildren，按位置索引就地复用现有组件实例，只更新传入 props。',
    watchPoints: [
      '列表顺序或头部元素变化时，组件实例不会跟随原人员移动',
      '组件内部 ref（备注输入框）停留在原位置，导致数据身份与内部状态错位',
    ],
  },
  {
    id: 'index-key',
    orderLabel: '02',
    title: '使用 index 作为 key',
    shortTitle: 'index key',
    templateCode: `<UserCard
  v-for="(user, index) in users"
  :key="index"
  :user="user"
/>`,
    mechanismSummary: 'key 虽在单次渲染内唯一，但绑定的是位置索引而非人员 ID，位置变动即改变匹配对象。',
    watchPoints: [
      '在常见单一组件列表更新中，与无 key 同样按位置 0..n 复用节点',
      '删除头部或头部插入后，后续人员 index 整体偏移，内部状态出现错位',
    ],
  },
  {
    id: 'unstable-key',
    orderLabel: '03',
    title: '使用唯一但不稳定的值作为 key',
    shortTitle: '不稳定 key',
    templateCode: `<UserCard
  v-for="user in users"
  :key="Math.random()"
  :user="user"
/>`,
    mechanismSummary: '每次父组件重新渲染都生成全新随机值，新旧 VNode 的 key 无法匹配，触发整批卸载与重建。',
    watchPoints: [
      '即使只修改字段或触发重渲染，旧实例仍被销毁（onUnmounted）并重新挂载（onMounted）',
      '组件内部输入状态全部丢失，产生不必要的 DOM 销毁与创建开销',
    ],
  },
  {
    id: 'stable-key',
    orderLabel: '04',
    title: '使用唯一且稳定的值作为 key',
    shortTitle: '稳定 ID key',
    templateCode: `<UserCard
  v-for="user in users"
  :key="user.id"
  :user="user"
/>`,
    mechanismSummary: '使用稳定的业务主键 user.id，Vue 精准建立新旧 VNode 身份映射，复用并移动对应实例。',
    watchPoints: [
      '原有人员保留原 DOM 实例，内部备注状态始终准确跟随对应人员',
      '仅新增人员创建新实例，仅被删人员卸载销毁，修改属性直接原地更新',
    ],
  },
];

export const STRATEGY_ORDER: KeyStrategyId[] = ['no-key', 'index-key', 'unstable-key', 'stable-key'];

export const CLASSIC_EXPERIMENTS: ClassicExperiment[] = [
  {
    id: 'exp-1',
    number: '实验一',
    title: '删除第一项',
    presetUsers: [
      { id: 101, name: '张三', age: 25 },
      { id: 102, name: '李四', age: 26 },
      { id: 103, name: '王五', age: 27 },
      { id: 104, name: '赵六', age: 28 },
    ],
    operationId: 'delete-first',
    operationLabel: '删除第一项',
    focusPoints: [
      '无 key / index key：DOM-A、DOM-B、DOM-C 就地复用给李四、王五、赵六，备注全部错位，末尾 DOM-D 被销毁',
      '不稳定 key：四个原有实例全部销毁，重建三个全新实例，原有自定义备注丢失',
      '稳定 ID key：DOM-A（张三）被准确销毁，李四、王五、赵六分别保留 DOM-B、DOM-C、DOM-D',
    ],
  },
  {
    id: 'exp-2',
    number: '实验二',
    title: '头部插入',
    presetUsers: [
      { id: 101, name: '张三', age: 25 },
      { id: 102, name: '李四', age: 26 },
      { id: 103, name: '王五', age: 27 },
    ],
    operationId: 'insert-head',
    operationLabel: '头部插入',
    focusPoints: [
      '无 key / index key：前三个位置按索引复用，新人占用了张三的 DOM-A 与备注，仅末尾多出一个新节点',
      '不稳定 key：原有 3 个节点全毁，重新挂载 4 个新节点',
      '稳定 ID key：仅在头部新建 1 个节点，张三、李四、王五原实例整体后移并保持各自备注',
    ],
  },
  {
    id: 'exp-3',
    number: '实验三',
    title: '反转顺序',
    presetUsers: [
      { id: 101, name: '张三', age: 25 },
      { id: 102, name: '李四', age: 26 },
      { id: 103, name: '王五', age: 27 },
    ],
    operationId: 'reverse',
    operationLabel: '反转顺序',
    focusPoints: [
      '无 key / index key：DOM-A、DOM-B、DOM-C 原地不动，首尾两项的组件内部备注发生对调错位（中间项仍为李四）',
      '不稳定 key：全部实例重建，备注全部重置',
      '稳定 ID key：DOM-C、DOM-B、DOM-A 按新顺序移动复用，备注与人员身份完美一致',
    ],
  },
  {
    id: 'exp-4',
    number: '实验四',
    title: '随机排序',
    presetUsers: [
      { id: 101, name: '张三', age: 25 },
      { id: 102, name: '李四', age: 26 },
      { id: 103, name: '王五', age: 27 },
      { id: 104, name: '赵六', age: 28 },
    ],
    operationId: 'shuffle',
    operationLabel: '随机排序',
    focusPoints: [
      '连续多次点击「随机排序」，观察无 key 与 index key 下内部状态持续错乱',
      '观察不稳定 key 每次都会触发 4 次销毁 + 4 次挂载，实例编号不断递增',
      '稳定 ID key 始终 0 销毁、0 新建，4 个实例精准移动复用',
    ],
  },
  {
    id: 'exp-5',
    number: '实验五',
    title: '数据内容修改',
    presetUsers: [
      { id: 101, name: '张三', age: 25 },
      { id: 102, name: '李四', age: 26 },
      { id: 103, name: '王五', age: 27 },
      { id: 104, name: '赵六', age: 28 },
    ],
    operationId: 'modify-data',
    operationLabel: '修改数据',
    focusPoints: [
      '仅修改张三的姓名或年龄，不改变其 ID（101）',
      '无 key、index key、稳定 ID key 均可复用原有组件实例，内部备注保持独立不受影响',
      '唯独不稳定 key 即使数据顺序与 ID 完全没变，也会强制销毁并重建全部节点',
    ],
  },
];

export const CORE_TAKEAWAYS = [
  {
    number: '01',
    title: '为什么没有 key 可能出现状态错位',
    body: 'Vue 默认对无 key 列表采用就地更新策略（patchUnkeyedChildren），按索引位置依次复用旧组件实例。当组件内部持有自身状态（如非受控输入框 ref）时，新数据会被渲染到旧实例上，导致“人换了，内部状态没换”。',
  },
  {
    number: '02',
    title: '为什么 index 不适合作为动态列表的 key',
    body: 'index 代表列表中的顺序位置，而不是数据本身的业务身份。当在头部或中间插入、删除、重排时，同一人员在前后两次渲染中的 index 会发生变化，导致 Vue 把旧位置的实例错误复用到新人员身上。',
  },
  {
    number: '03',
    title: '为什么“唯一”还不够，必须同时“稳定”',
    body: '如 Math.random() 每次渲染都能生成互不重复的值，但因为前后两次渲染的值不相等，Vue 无法在新旧 VNode 之间建立对应关系，只能销毁旧组件并挂载新组件，导致内部状态丢失和生命周期重复执行。',
  },
  {
    number: '04',
    title: '为什么应该使用唯一且稳定的 key',
    body: '稳定的业务 ID（如 user.id）在列表增删、排序、局部更新时保持不变。Vue 能通过 key 精准匹配新旧 VNode，在必要时移动或复用组件实例，让组件内部状态与数据身份始终保持一致。',
  },
];

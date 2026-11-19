# Vue 3 列表渲染 Key 差异可视化实验 Spec

## Why

`v-for` 的 `key` 是 Vue 虚拟 DOM diff 算法的核心概念。开发者常见误区是直接使用数组索引 `index` 作为 key，在列表发生顺序变化或中间插入/删除时会导致组件状态错位、不必要的 DOM 重建。本 Demo 通过并排可视化对比「index 作为 key」与「稳定 id 作为 key」在相同操作下的真实 DOM 复用与组件状态保留差异，帮助开发者直观理解 key 的作用机制。

> 注：用户提供的原始设计文档位于其本机路径，沙箱无法访问。本规格依据文档标题与仓库 `docs/app-conventions.md` 规范自行设计，覆盖该主题的标准实验点。

## What Changes

- 新增自包含 App `apps/vue-list-key-demo/`（Vue 3 + Vite，基于 `templates/vue`）。
- 实现左右并排的两组列表实验区：左侧使用 `index` 作为 key，右侧使用稳定唯一 `id` 作为 key，两组列表共享同一份数据操作。
- 提供列表操作控件：头部插入、尾部插入、随机位置插入、删除指定项、反转顺序、随机洗牌。
- 每个列表项内含可交互的本地状态（输入框内容 / 计数器），用于暴露 key 不同导致的状态绑定差异。
- 提供操作日志面板，记录每次操作触发的 DOM 元素创建/复用与组件挂载/卸载情况（通过项组件生命周期钩子 + DOM 节点标识统计）。
- 提供「重置」功能恢复初始数据与日志。
- 编写独立 `README.md`，包含介绍、演示目标、知识点、运行与使用说明。
- 更新根目录 `pnpm-lock.yaml`（根目录 `pnpm install`）。

## Impact

- Affected specs: 新增 Demo 能力（apps 目录），不修改任何既有 App 或模板。
- Affected code:
  - 新增 `apps/vue-list-key-demo/` 全部文件（package.json、vite.config.js、index.html、src/、README.md）。
  - 修改根目录 `pnpm-lock.yaml`（由包管理器自动更新）。
  - 不改动 `templates/`、`scripts/`、`docs/` 及仓库配置。

## ADDED Requirements

### Requirement: 双列对比实验布局

系统 SHALL 在同一页面并排展示两个结构与样式完全一致的列表实验区，唯一差异是 `v-for` 的 key 取值：左侧绑定 `index`，右侧绑定数据项的稳定 `id`。两区顶部须明确标注当前使用的 key 策略。

#### Scenario: 初始渲染
- **WHEN** 用户打开页面
- **THEN** 左右两区渲染相同的初始列表（至少 4 项，每项展示序号、id、名称及本地交互控件），并标注「:key="index"」与「:key="item.id"」。

### Requirement: 列表操作控件

系统 SHALL 提供一组对两区同时生效的列表操作按钮，使两组列表在每次操作后数据完全相同，仅 diff 行为不同。

#### Scenario: 头部插入
- **WHEN** 用户点击「头部插入」
- **THEN** 两区列表头部均出现一个带新 id 的新数据项。

#### Scenario: 中间删除
- **WHEN** 用户点击某项的「删除」
- **THEN** 两区同步移除对应 id 的数据项。

#### Scenario: 反转与洗牌
- **WHEN** 用户点击「反转顺序」或「随机洗牌」
- **THEN** 两区数据顺序一致地改变，便于对比 DOM 移动与复用差异。

### Requirement: 项内本地状态暴露 key 差异

每个列表项组件 SHALL 持有不随重渲染重置的本地状态（一个文本输入框和一个计数按钮），用于直观呈现状态与 DOM 节点的归属关系。

#### Scenario: index key 下头部插入导致状态错位
- **GIVEN** 用户在左侧（index key）第二项的输入框中输入了标记文本
- **WHEN** 在头部插入一个新项
- **THEN** 原输入框文本停留在「第二个渲染位置」的组件上（跟随 index 而非原数据项），表现为状态与数据错位。

#### Scenario: id key 下状态跟随数据项
- **GIVEN** 用户在右侧（id key）某数据项的输入框中输入标记文本
- **WHEN** 执行头部插入、反转或洗牌
- **THEN** 该文本始终跟随原 id 对应的数据项移动，状态与数据保持一致。

### Requirement: DOM 复用与生命周期日志

系统 SHALL 通过项组件的 `onMounted` / `onBeforeUnmount` 钩子以及 DOM 节点 `data-` 标识，统计并展示每次操作后两区的新建组件数、卸载组件数与复用情况，以时间线日志形式呈现。

#### Scenario: 反转操作的日志对比
- **WHEN** 用户执行「反转顺序」
- **THEN** 日志区分别输出两区本次操作的 mounted/unmounted 计数；index 区与 id 区的计数差异可被观察到（id key 以节点移动复用为主）。

### Requirement: 重置与自包含规范

系统 SHALL 提供重置按钮恢复初始列表并清空日志；App SHALL 满足仓库 `app-conventions.md`：目录名与 package.json `name` 一致、`private: true`、含独立 README、无内部依赖、无 App 级锁文件。

#### Scenario: 重置
- **WHEN** 用户点击「重置」
- **THEN** 两区数据恢复初始状态，所有本地状态与日志清空。

#### Scenario: 规范检查
- **WHEN** 在仓库根目录执行 `pnpm apps:check`
- **THEN** `vue-list-key-demo` 检查结果为 PASS，且 `pnpm build` 可成功构建。

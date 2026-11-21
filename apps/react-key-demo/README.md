# React Key 可视化实验室（react-key-demo）

## 1. Demo 介绍

`react-key-demo` 是一个基于 **React 19 + Hooks + TypeScript** 构建的**列表渲染 `key` 差异可视化实验台**。

本实验完全依托 React 19 真实的 Fiber 协调（Reconciliation）与真实 DOM 挂载/卸载生命周期（`useEffect`），不通过静态动画伪造 Diff 结果，直观对比四种 `key` 策略在同一操作下的组件复用、销毁重建与内部 `useState` 状态错位情况。

## 2. 演示目标

直观对比 React JSX 列表在以下四种 `key` 策略下的真实差异：

1. **未配置 `key`**：React 将 `element.key` 视为 `null`，按位置索引就地复用 Fiber 与 DOM 节点（同时在开发控制台提示 missing key 警告），容易导致组件内部 `useState` 状态与数据身份错位。
2. **使用 `index` 作为 `key`**：`index` 仅代表当前位置而非数据身份，当列表发生头部删除、头部插入或重排时同样会造成状态错位。
3. **使用唯一但不稳定的值作为 `key`**：每次渲染都生成新 `key`（如 `Math.random()`），React Fiber 无法匹配旧节点，导致整批组件反复卸载（cleanup）与重新挂载（remount）、内部状态丢失。
4. **使用唯一且稳定的 ID 作为 `key`**：帮助 React Fiber 在新旧元素之间建立精准的身份映射，实现正确的节点复用、移动、创建与销毁，内部状态始终跟随数据身份。

## 3. 涉及的技术知识

- React 19 列表渲染（`Array.prototype.map` 与 `key`）
- React Fiber 协调算法（`reconcileChildrenArray`）
- 组件实例挂载/卸载追踪（`useEffect` mount / cleanup）
- 组件内部非受控状态（`useState`）与 Props 身份分离现象

## 4. 环境要求

- Node.js `>= 20`
- pnpm（或 npm / yarn）

## 5. 安装方式

```bash
pnpm install
```

（若使用 npm，可执行 `npm install`。）

## 6. 启动方式

```bash
pnpm dev
```

构建与类型检查：

```bash
pnpm build
```

## 7. 使用说明

1. **统一操作区**：支持删除第一项、删除中间项、头部插入、中间插入、反转顺序、随机排序、修改数据、父组件重渲染以及重置；所有操作同步作用于四种策略。
2. **一行四列同排对比**：桌面端以四列等高并排展示，突出展示发生新建、销毁、移动、字段更新与状态错位的卡片，未发生变化且身份一致的卡片自动弱化。
3. **自定义状态验证**：每个人员卡片内的备注输入框保存在 `UserCard` 组件内部 `useState` 中。可直接修改任意卡片的备注或点击「标记」按钮后执行列表操作，观察状态跟随、错位或丢失现象。
4. **逐步执行模式**：将一次更新拆解为「操作前 → 数据变化 → 新旧 Fiber 对比 → 组件更新 → 更新完成」五个阶段进行教学演示。

## 8. 相关注意事项

- 为保证组件挂载/卸载计数（`DOM-A / DOM-B / ...`）准确反映真实的列表协调行为而非开发模式的双重调用测试，`src/main.tsx` 直接挂载 `<App />` 而未包裹 `<React.StrictMode>`。
- 未配置 `key` 面板在开发模式下会真实触发 React 原生的 `Each child in a list should have a unique "key" prop` 控制台提示，这属于实验本身的真实机制现象。

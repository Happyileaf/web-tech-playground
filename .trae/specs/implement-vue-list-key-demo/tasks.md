# Tasks

- [ ] Task 1: 初始化 App 骨架：基于 `templates/vue` 创建 `apps/vue-list-key-demo/`，使 package.json 的 name 与目录名一致、`private: true`，配置 Vite 端口与标题。
  - [ ] SubTask 1.1: 复制模板并改名为 vue-list-key-demo，更新 package.json、index.html 标题、vite.config.js
  - [ ] SubTask 1.2: 规划 src 目录结构（App.vue、组件、composables、样式）
- [ ] Task 2: 实现列表数据与操作逻辑：共享数据源（每项含稳定 id、名称），提供头部插入、尾部插入、随机插入、删除、反转、洗牌、重置操作。
  - [ ] SubTask 2.1: 用 composable 封装列表状态与操作函数
  - [ ] SubTask 2.2: 保证操作对两个实验区同步生效
- [ ] Task 3: 实现项组件与双列对比布局：创建 ListItem 组件（含本地输入框与计数器状态、生命周期钩子上报、DOM data 标识），左右两区分别以 index 与 item.id 作为 key 渲染同一数据。
  - [ ] SubTask 3.1: 实现 ListItem.vue 本地状态与 mounted/beforeUnmount 上报
  - [ ] SubTask 3.2: 实现 App.vue 双列布局与 key 策略标注
- [ ] Task 4: 实现日志/统计面板：按操作时间线记录两区 mounted、unmounted 计数与累计 DOM 节点创建数，支持随重置清空。
- [ ] Task 5: 完善样式与可视化：让状态错位、节点移动/复用差异肉眼可辨（颜色、过渡高亮、key 徽标）。
- [ ] Task 6: 编写 README.md（介绍、演示目标、知识点、环境、安装、启动、使用说明、注意事项）。
- [ ] Task 7: 验证与提交：根目录 `pnpm install` 更新锁文件，`pnpm apps:check` 通过，App 内 `pnpm build` 成功；在独立分支提交并推送、创建 PR。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 3
- Task 6 depends on Task 3
- Task 7 depends on Task 4, Task 5, Task 6

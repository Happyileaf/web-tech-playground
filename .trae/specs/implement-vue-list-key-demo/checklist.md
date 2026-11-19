# Checklist

- [ ] `apps/vue-list-key-demo/` 存在且 package.json `name` 等于目录名、含 `"private": true`
- [ ] 页面并排展示两个实验区，左侧 `:key="index"`、右侧 `:key="item.id"`，并有明确文字标注
- [ ] 操作控件（头部插入、尾部插入、随机插入、删除、反转、洗牌、重置）对两区同步生效，两区数据始终一致
- [ ] 每个列表项含本地输入框与计数器，且状态在重渲染时不被重置
- [ ] 头部插入后，index 区出现输入状态与数据错位，id 区状态始终跟随原数据项
- [ ] 反转/洗牌后，id 区本地状态跟随原 id 数据项移动
- [ ] 日志面板按操作记录两区 mounted/unmounted 计数，能体现两种 key 策略的差异
- [ ] 重置按钮恢复初始数据并清空日志与本地状态
- [ ] README.md 包含介绍、演示目标、知识点、环境要求、安装、启动、使用说明
- [ ] App 无 `workspace:`/`file:` 内部依赖，App 目录内无 pnpm-lock.yaml
- [ ] 根目录 `pnpm apps:check` 对该 App 输出 PASS
- [ ] App 内 `pnpm build` 构建成功
- [ ] 变更在独立分支提交，已推送到 origin 并创建 PR

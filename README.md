# web-tech-playground

基于 Monorepo（pnpm Workspaces）组织的 Web 技术实验仓库，存放各种独立、自包含的技术 Demo。

每个 Demo 通过最小化、可运行的案例来验证技术原理、演示技术特性、复现常见问题，并可随时脱离本仓库独立迁移运行。

## 目录结构

```text
web-tech-playground/
├── apps/        # 所有独立的技术 Demo（扁平结构，不按技术栈分层）
├── docs/        # 仓库级设计文档与规范
├── scripts/     # 仓库级管理脚本
├── package.json
├── pnpm-workspace.yaml
├── .npmrc
└── .nvmrc
```

## 环境要求

- Node.js（建议版本见 `.nvmrc`，要求 `>=20`）
- pnpm（版本见 `package.json` 的 `packageManager` 字段）

```bash
# 安装依赖（在仓库根目录执行，生成统一的 pnpm-lock.yaml）
pnpm install
```

## 常用命令

```bash
# 列出 apps/ 下的所有 Demo
pnpm apps:list

# 检查所有 Demo 是否满足自包含与基础规范
pnpm apps:check
```

运行某个具体 Demo：

```bash
cd apps/<app-name>
pnpm install
pnpm dev
```

## 核心约束

- 每个 App 必须自包含，拥有独立的 `package.json`、配置和 `README.md`。
- 允许依赖 npm 第三方库、浏览器原生 API、Node.js 内置模块与外部服务。
- 禁止依赖仓库内其他 App 的源码、配置或静态资源，禁止 `workspace:*` / `file:` 形式的内部依赖。
- 整个 Monorepo 使用根目录统一的 `pnpm-lock.yaml`；App 独立迁移后可自行重新生成锁文件。

## 文档

- [架构设计文档](docs/architecture.md)
- [开发指南](docs/development-guide.md)
- [App 规范](docs/app-conventions.md)

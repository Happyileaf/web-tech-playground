# 开发指南

本文档说明 `web-tech-playground` 的日常使用与开发方式。仓库整体架构见 [architecture.md](./architecture.md)，App 规范见 [app-conventions.md](./app-conventions.md)。

## 1. 环境准备

- Node.js：建议使用 `.nvmrc` 指定的版本（要求 `>=20`）。

  ```bash
  nvm use
  ```

- pnpm：版本由根目录 `package.json` 的 `packageManager` 字段指定。推荐通过 Corepack 启用：

  ```bash
  corepack enable
  corepack prepare pnpm@10.5.2 --activate
  ```

## 2. 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

pnpm Workspaces 会识别 `apps/*` 下的所有项目，并在根目录生成统一的 `pnpm-lock.yaml`。

## 3. 仓库级命令

```bash
# 列出 apps/ 下的所有 Demo
pnpm apps:list

# 检查所有 Demo 是否满足自包含与基础规范
pnpm apps:check
```

## 4. 运行一个 App

每个 App 都是自包含项目，进入对应目录后使用其自己的脚本：

```bash
cd apps/<app-name>
pnpm install
pnpm dev
```

具体脚本以该 App 的 `package.json` 和 `README.md` 为准。

## 5. 新建一个 App

### 方式一：基于模板

`templates/` 提供可选初始化模板，复制后重命名即可：

| 模板 | 适用场景 |
|---|---|
| `templates/vanilla` | 原生 HTML / CSS / JavaScript，无构建步骤 |
| `templates/vite` | 基于 Vite 的通用前端项目 |
| `templates/vue` | Vue 3 + Vite |
| `templates/react` | React + Vite |
| `templates/node` | Node.js 脚本 / 服务 |

```bash
cp -r templates/vue apps/my-topic-demo
```

复制后需要：

1. 将 `package.json` 的 `name` 改为与目录名一致。
2. 按需修改依赖、配置和源码。
3. 编写该 App 自己的 `README.md`。
4. 在根目录执行 `pnpm install` 更新锁文件。

### 方式二：手动创建

在 `apps/` 下新建目录，自行初始化项目。无论采用哪种方式，都必须满足 [app-conventions.md](./app-conventions.md) 中的规范。

## 6. 提交前检查

提交新的或修改过的 App 前，建议在根目录运行：

```bash
pnpm apps:check
```

确认所有 App 均通过自包含与基础规范检查。

## 7. 独立迁移

任意 App 都可以脱离本仓库独立运行：

```bash
cp -r apps/<app-name> /path/to/<app-name>
cd /path/to/<app-name>
pnpm install
pnpm dev
```

迁移后可重新生成锁文件，不要求与仓库内的锁定结果完全一致。

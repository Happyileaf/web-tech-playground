# Web Tech Playground — 仓库架构设计

## 1. 项目定位

`web-tech-playground` 是一个基于 Monorepo 模式组织的 Web 技术实验仓库。

仓库用于存放各种独立的技术 Demo，通过实际代码验证技术原理、演示技术特性、复现常见问题，以及探索不同技术方案。

项目不以构建完整业务系统为目标，而是强调：

- **技术实验**：通过最小化、可运行的案例理解技术原理。
- **问题复现**：将开发过程中遇到的典型问题转化为可重复验证的 Demo。
- **可视化演示**：对于适合可视化的技术主题，提供直观的交互演示。
- **独立运行**：每个 Demo 都是一个自包含的独立项目。
- **方便迁移**：每个 Demo 都可以脱离当前仓库，独立复制和运行。

### 1.1 技术范围

仓库主要围绕 Web 技术展开，包括但不限于：

| 技术方向 | 示例 |
|---|---|
| HTML / CSS | 布局、动画、渲染、CSS 特性 |
| JavaScript | 数据类型、作用域、异步编程、事件循环 |
| 浏览器 API | DOM、Storage、Web Worker、WebSocket |
| 前端框架 | Vue、React 等 |
| 前端工程化 | Webpack、Vite、模块化、构建优化 |
| 网络与通信 | HTTP、WebSocket、WebRTC |
| Node.js | HTTP 服务、Stream、事件机制 |
| 服务端 Web 框架 | Express、Koa、NestJS 等 |

具体技术栈不做强制限制，后续可以根据实际实验需求持续扩展。

---

## 2. 仓库整体结构

采用扁平化的 `apps/` 目录组织所有 Demo。

不按照 Vue、React、Node.js 等技术栈进行二次分类，避免随着技术方向增加而不断调整目录结构。

```text
web-tech-playground/
│
├── apps/
│   ├── vue-key-demo/
│   ├── vue-keep-alive-demo/
│   ├── react-hooks-demo/
│   ├── event-loop-demo/
│   ├── promise-demo/
│   ├── browser-storage-demo/
│   ├── web-worker-demo/
│   ├── websocket-demo/
│   ├── webrtc-demo/
│   ├── node-http-server-demo/
│   ├── node-stream-demo/
│   ├── koa-middleware-demo/
│   └── express-middleware-demo/
│
├── docs/
│
├── scripts/
│
├── templates/
│
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── .gitignore
├── .npmrc
├── .nvmrc
└── README.md
```

### 2.1 目录职责

| 目录 | 职责 |
|---|---|
| `apps/` | 存放所有独立的技术 Demo |
| `docs/` | 存放仓库级别的设计文档、规范和说明 |
| `scripts/` | 存放仓库级别的管理脚本 |
| `templates/` | 存放创建新 Demo 时使用的项目模板 |

根目录配置文件负责管理整个 Monorepo，不承担具体 Demo 的运行职责。

### 2.2 为什么采用扁平结构

每个 Demo 都可以通过名称识别其技术主题，不需要额外的技术栈目录。

例如：

```text
apps/
├── vue-key-demo/
├── react-hooks-demo/
├── promise-demo/
└── webrtc-demo/
```

这种组织方式具有以下特点：

- 目录层级少，查找和管理方便。
- 新增技术方向时不需要调整现有目录。
- 不会因为一个 Demo 涉及多个技术栈而产生归属问题。
- 更符合每个 Demo 独立存在的设计原则。

---

## 3. App 自包含设计

这是整个仓库最重要的架构约束。

**每一个 App 必须是自包含的独立项目，不允许依赖仓库内部的其他项目。**

App 在仓库中通过 Monorepo 统一管理，但在运行和代码组织上保持独立。

### 3.1 App 的基本结构

每个 App 根据自身技术栈组织目录，不要求所有 App 使用完全相同的内部结构。

例如：

```text
apps/
└── vue-key-demo/
    ├── src/
    ├── public/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── README.md
    └── ...
```

另一个 Node.js Demo 可以采用不同的结构：

```text
apps/
└── node-http-server-demo/
    ├── src/
    ├── package.json
    ├── README.md
    └── ...
```

不强制统一 `src/`、`public/`、`config/` 等内部目录。

只要满足项目自身的运行需求即可。

### 3.2 依赖边界

明确采用以下原则：

**允许依赖外部服务，不允许依赖仓库内部其他项目。**

具体规则如下：

| 依赖类型 | 是否允许 | 说明 |
|---|---|---|
| npm 第三方依赖 | 允许 | 在 App 自己的 `package.json` 中声明 |
| 浏览器原生 API | 允许 | 例如 DOM、WebSocket、WebRTC |
| Node.js 内置模块 | 允许 | 例如 fs、path、http |
| 外部 HTTP API | 允许 | 例如第三方接口服务 |
| 外部基础设施 | 允许 | 例如 Redis、MySQL、Kafka |
| 其他 App 的源码 | 禁止 | 不允许跨 App 引用源码 |
| 其他 App 的配置 | 禁止 | 不允许依赖其他 App 的构建或运行配置 |
| 其他 App 的静态资源 | 禁止 | 不允许跨 App 引用资源文件 |
| 仓库根目录运行时代码 | 禁止 | 根目录不提供 App 运行时依赖 |
| 仓库内部共享 Package | 禁止 | 不通过 Workspace Package 共享代码 |

例如，以下结构不允许：

```text
apps/
├── demo-a/
│   └── src/
│       └── utils.js
│
└── demo-b/
    └── src/
        └── main.js
```

`demo-b` 不允许直接引用 `demo-a` 的 `utils.js`。

如果多个 Demo 存在相似代码，可以在各自项目中独立维护。当前阶段不为了代码复用引入内部共享 Package。

### 3.3 外部服务依赖

App 可以依赖仓库之外的服务。

例如：

```text
apps/
└── websocket-demo/
    ├── client/
    ├── server/
    ├── package.json
    └── README.md
```

该 App 可以同时包含浏览器客户端和 Node.js 服务端，也可以依赖外部 Redis 等基础设施。

但所有相关代码和配置都必须属于当前 App。

外部服务的地址、账号配置方式、启动要求等，应在当前 App 的 README 中说明。

### 3.4 独立迁移能力

每个 App 都应该能够脱离当前仓库独立存在。

迁移时，只需要复制 App 目录，并根据自己的 `package.json` 安装依赖即可。

例如：

```bash
cp -r apps/vue-key-demo /path/to/vue-key-demo

cd /path/to/vue-key-demo

pnpm install

pnpm dev
```

迁移后的 App 不应该因为缺少原仓库中的其他目录、配置文件或源码而无法运行。

需要注意：独立迁移后可以重新生成锁文件，因此不承诺迁移前后依赖解析结果完全一致。

---

## 4. App 项目规范

### 4.1 独立 package.json

每个 App 必须拥有自己的 `package.json`。

例如：

```json
{
  "name": "vue-key-demo",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.0.0"
  },
  "devDependencies": {
    "vite": "^7.0.0"
  }
}
```

具体依赖和脚本由 App 自己决定。

根目录不统一管理 App 的运行时依赖。

### 4.2 独立配置

每个 App 自己维护所需的配置文件。

例如：

- Vite 配置
- Webpack 配置
- TypeScript 配置
- ESLint 配置
- Babel 配置
- PostCSS 配置
- 环境变量配置

不要求所有 App 使用相同的构建工具或开发规范。

根目录可以维护 Monorepo 管理所需的配置，但不能让 App 在运行时依赖根目录中的配置文件。

### 4.3 独立 README

每个 App 必须有自己的 `README.md`。

建议包含：

1. Demo 介绍
2. 演示目标
3. 涉及的技术知识
4. 环境要求
5. 安装方式
6. 启动方式
7. 使用说明
8. 相关注意事项

例如：

```markdown
# Vue Key Demo

## 介绍

通过可视化案例演示 Vue 列表渲染时不同 key 配置产生的差异。

## 技术知识

- Vue 列表渲染
- 虚拟 DOM
- Diff 算法
- 组件复用

## 环境要求

- Node.js
- pnpm

## 安装

pnpm install

## 启动

pnpm dev
```

README 应该让使用者即使不查看仓库根目录文档，也能理解和运行当前 App。

---

## 5. Monorepo 与依赖管理

### 5.1 使用 pnpm Workspaces

使用 pnpm Workspaces 管理整个仓库。

根目录 `pnpm-workspace.yaml`：

```yaml
packages:
  - "apps/*"
```

所有 `apps/` 下的一级目录都会作为 Workspace 项目进行管理。

### 5.2 依赖管理原则

虽然所有 App 位于同一个 Monorepo 中，但每个 App 仍然独立声明自己的依赖。

例如：

```text
apps/
├── vue-key-demo/
│   └── package.json
│
├── react-hooks-demo/
│   └── package.json
│
└── node-http-server-demo/
    └── package.json
```

各 App 可以使用完全不同的技术栈和依赖版本。

不要求不同 App 之间的依赖版本保持一致。

### 5.3 锁文件策略

**整个 Monorepo 使用一个根目录锁文件：`pnpm-lock.yaml`。**

不在每个 App 内部维护独立的 `pnpm-lock.yaml`。

原因：

- pnpm Workspaces 默认采用统一锁文件管理。
- 减少多个锁文件带来的维护成本。
- 方便统一安装和管理仓库依赖。
- 符合当前技术实验仓库的实际需求。

需要明确：

- 根目录锁文件负责记录整个 Workspace 的依赖解析结果。
- 每个 App 通过自己的 `package.json` 声明直接依赖。
- App 不依赖其他 App 的代码或内部 Package。
- App 独立迁移后，可以根据自己的 `package.json` 重新安装依赖并生成新的锁文件。

当前不追求每个 App 在仓库内外拥有完全一致的依赖锁定结果。

### 5.4 禁止 Workspace 内部依赖

不允许 App 之间通过以下方式建立依赖：

```json
{
  "dependencies": {
    "demo-a": "workspace:*"
  }
}
```

也不允许通过本地 `file:` 路径引用仓库内的其他 App。

Workspace 在这里主要承担统一管理和安装职责，而不是用于构建 App 之间的依赖关系。

### 5.5 根目录 package.json

根目录 `package.json` 只负责 Monorepo 管理，不承担具体 App 的运行职责。

示例：

```json
{
  "name": "web-tech-playground",
  "private": true,
  "scripts": {
    "apps:list": "node scripts/list-apps.mjs",
    "apps:check": "node scripts/check-apps.mjs"
  }
}
```

可以根据实际需求增加仓库级脚本，例如：

- 列出所有 App
- 检查 App 是否满足基本规范
- 批量执行指定操作

不在根目录安装 Vue、React、Vite 等 App 运行时依赖。

### 5.6 Node.js 与 pnpm 版本

可以通过根目录配置提供默认环境版本。

- `.nvmrc`：指定仓库默认 Node.js 版本。
- `packageManager`：在根目录 `package.json` 中指定 pnpm 版本。
- `engines.node`：App 可以根据自身需求声明 Node.js 版本要求。

如果某个 App 对 Node.js 版本有特殊要求，应在自己的 README 中明确说明。

---

## 6. 命名规范

### 6.1 App 命名

统一使用：

```text
<技术主题>-<演示目标>-demo
```

例如：

```text
vue-key-demo
vue-keep-alive-demo
react-hooks-demo
event-loop-demo
promise-demo
websocket-demo
webrtc-demo
node-stream-demo
```

命名要求：

- 使用小写字母。
- 单词之间使用连字符 `-`。
- 名称尽量简洁。
- 能够体现 Demo 的核心技术主题。
- 避免使用含义模糊的名称。

### 6.2 Package 命名

App 的 `package.json` 中，`name` 与 App 目录名称保持一致。

例如：

```json
{
  "name": "vue-key-demo"
}
```

---

## 7. 模板与仓库级文档

### 7.1 templates

`templates/` 用于存放创建新 App 时使用的初始化模板。

例如：

```text
templates/
├── vanilla/
├── vite/
├── vue/
├── react/
└── node/
```

模板只用于复制和初始化，不作为运行时依赖。

创建 App 后，App 应拥有自己的完整文件和配置，不再依赖原始模板目录。

模板的存在是为了减少重复初始化工作，不意味着所有 App 都必须使用模板。

### 7.2 docs

`docs/` 用于存放仓库整体的设计说明和管理规范。

例如：

```text
docs/
├── architecture.md
├── development-guide.md
└── app-conventions.md
```

其中：

- `architecture.md`：说明仓库整体架构和设计原则。
- `development-guide.md`：说明仓库的使用和开发方式。
- `app-conventions.md`：说明 App 的目录、命名和自包含规范。

具体 Demo 的技术说明仍然放在各自的 README 中。

---

## 8. 后续扩展方向

当前阶段只需要建立清晰、稳定的仓库结构，不需要提前引入复杂的平台能力。

后续可以根据实际需求逐步增加：

| 扩展方向 | 说明 |
|---|---|
| App 索引 | 自动收集 App 名称、描述、技术标签 |
| Demo 展示站 | 提供统一入口浏览和运行 Demo |
| 自动化检查 | 检查 App 是否满足自包含和基础规范 |
| CI | 对发生变更的 App 执行对应检查 |
| Docker | 为需要特定服务环境的 App 提供运行方式 |

这些能力都不是当前仓库成立的前置条件。

---

## 9. 架构决策总结

| 设计事项 | 最终决策 |
|---|---|
| 仓库名称 | `web-tech-playground` |
| 仓库模式 | Monorepo |
| 包管理工具 | pnpm |
| Workspace | pnpm Workspaces |
| Demo 存放目录 | `apps/` |
| App 目录组织 | 扁平结构，不按技术栈分层 |
| App 独立性 | 每个 App 必须自包含 |
| App 之间的依赖 | 禁止 |
| 仓库内部共享 Package | 不引入 |
| 外部 npm 依赖 | 允许 |
| 外部服务依赖 | 允许 |
| App 配置 | 每个 App 独立维护 |
| App README | 每个 App 必须拥有 |
| 锁文件 | 使用根目录统一的 `pnpm-lock.yaml` |
| App 独立迁移 | 复制目录后可独立安装和运行 |
| 项目模板 | 提供可选初始化模板 |
| 后续扩展 | 按实际需求逐步增加 |

---

## 10. 核心设计原则

整个仓库遵循以下原则：

1. **统一管理，独立运行**：通过 Monorepo 管理所有 Demo，但不建立 App 之间的依赖关系。
2. **允许外部依赖，禁止内部依赖**：App 可以使用第三方库和外部服务，但不能依赖仓库内其他项目。
3. **每个 App 自包含**：源码、配置、资源和运行说明都属于当前 App。
4. **简单优先**：不为了代码复用、统一技术栈或未来可能的需求引入不必要的抽象。
5. **便于迁移**：每个 App 都可以独立复制到其他仓库或环境中运行。
6. **渐进式扩展**：先满足技术实验和 Demo 管理需求，再根据实际使用情况增加能力。

**最终目标：构建一个结构简单、边界清晰、易于扩展，并且每个 Demo 都能够独立运行的 Web 技术实验仓库。**

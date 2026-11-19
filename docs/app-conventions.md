# App 规范

本文档规定 `apps/` 下每个 Demo 必须遵守的目录、命名与自包含规范。

## 1. 目录组织

- 所有 Demo 位于 `apps/` 下，采用扁平结构，不按技术栈二次分层。
- 每个 App 一个一级目录，例如 `apps/promise-demo/`。
- App 内部结构由自身技术栈决定，不强制统一 `src/`、`public/` 等目录。

## 2. 命名规范

- 目录名格式：`<技术主题>-<演示目标>-demo`。
- 全部小写，单词之间使用连字符 `-`，名称简洁且能体现核心技术主题。
- `package.json` 的 `name` 必须与目录名一致。

示例：

```text
vue-key-demo
react-hooks-demo
event-loop-demo
websocket-demo
node-stream-demo
```

## 3. 必备文件

每个 App 必须包含：

- `package.json`：声明自己的依赖与脚本，并设置 `"private": true`。
- `README.md`：独立的运行说明，不依赖仓库根目录文档。

App 自己维护所需的全部配置文件（Vite / Webpack / TypeScript / ESLint / 环境变量等），运行时不得依赖根目录配置。

## 4. README 建议内容

1. Demo 介绍
2. 演示目标
3. 涉及的技术知识
4. 环境要求
5. 安装方式
6. 启动方式
7. 使用说明
8. 相关注意事项（含外部服务的地址、账号与启动要求）

## 5. 依赖边界

**允许依赖外部服务，不允许依赖仓库内部其他项目。**

| 依赖类型 | 是否允许 |
|---|---|
| npm 第三方依赖（在 App 自己的 `package.json` 中声明） | 允许 |
| 浏览器原生 API（DOM、WebSocket、WebRTC 等） | 允许 |
| Node.js 内置模块（fs、path、http 等） | 允许 |
| 外部 HTTP API / 外部基础设施（Redis、MySQL 等） | 允许 |
| 其他 App 的源码、配置、静态资源 | 禁止 |
| 仓库根目录运行时代码 | 禁止 |
| 仓库内部共享 Package | 禁止 |

明确禁止：

```json
{
  "dependencies": {
    "other-demo": "workspace:*"
  }
}
```

也禁止通过本地 `file:` 路径引用仓库内其他 App。多个 Demo 之间的相似代码各自独立维护，当前阶段不引入内部共享 Package。

## 6. 锁文件

- 整个 Monorepo 只使用根目录统一的 `pnpm-lock.yaml`。
- App 目录内不得维护自己的 `pnpm-lock.yaml`。
- App 独立迁移后，可根据自己的 `package.json` 重新安装并生成新的锁文件。

## 7. 独立迁移验收

一个合格的 App 应满足：复制 `apps/<app-name>` 到任意位置后，仅依据自身文件执行 `pnpm install` 与启动命令即可运行，不依赖原仓库中的任何其他目录、配置或源码。

可通过根目录的 `pnpm apps:check` 进行基础规范自动检查。

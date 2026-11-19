# Node Template

零第三方依赖的 Node.js 模板，仅使用内置模块启动一个 HTTP 服务，适合 Node.js API、Stream、事件机制等实验。

## 环境要求

- Node.js `>=20`

## 使用

```bash
pnpm install
pnpm dev
```

- `pnpm dev`：使用 `node --watch` 监听文件变化自动重启。
- `pnpm start`：普通方式启动。

打开 http://localhost:3000 查看返回的 JSON（可通过 `PORT` 环境变量修改端口）。

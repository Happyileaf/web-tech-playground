# Vanilla Template

原生 HTML / CSS / JavaScript 模板，无第三方构建依赖，使用 Node.js 内置模块提供静态服务。

## 使用

```bash
pnpm install
pnpm dev
```

打开 http://localhost:3000 查看页面（可通过 `PORT` 环境变量修改端口）。

也可以直接用浏览器打开 `index.html`，或使用任意静态服务器托管当前目录。

## 目录说明

```text
├── index.html      # 页面入口
├── src/
│   ├── main.js     # 脚本入口
│   └── style.css   # 样式
└── server.mjs      # 零依赖静态文件服务器
```

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(new URL("..", import.meta.url).pathname);
const appsDir = join(root, "apps");

async function loadApps() {
  const entries = await readdir(appsDir, { withFileTypes: true });
  const apps = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgPath = join(appsDir, entry.name, "package.json");
    try {
      const raw = await readFile(pkgPath, "utf8");
      const pkg = JSON.parse(raw);
      apps.push({ name: entry.name, description: pkg.description ?? "" });
    } catch {
      // 目录存在但缺少合法 package.json，跳过
    }
  }

  return apps.sort((a, b) => a.name.localeCompare(b.name));
}

const apps = await loadApps();

if (apps.length === 0) {
  console.log("apps/ 下暂时没有 Demo。");
} else {
  console.log(`共 ${apps.length} 个 App：\n`);
  for (const app of apps) {
    console.log(`- ${app.name}${app.description ? `：${app.description}` : ""}`);
  }
}

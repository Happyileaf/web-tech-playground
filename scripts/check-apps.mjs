import { readdir, access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(new URL("..", import.meta.url).pathname);
const appsDir = join(root, "apps");

const INTERNAL_DEP_PATTERN = /^(workspace:|file:)/;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function collectInternalDeps(deps) {
  if (!deps || typeof deps !== "object") return [];
  return Object.entries(deps)
    .filter(([, spec]) => typeof spec === "string" && INTERNAL_DEP_PATTERN.test(spec))
    .map(([name, spec]) => `${name}: ${spec}`);
}

async function checkApp(dirName) {
  const appPath = join(appsDir, dirName);
  const errors = [];

  const pkgPath = join(appPath, "package.json");
  if (!(await exists(pkgPath))) {
    return { dirName, errors: ["缺少 package.json"] };
  }

  let pkg;
  try {
    pkg = JSON.parse(await readFile(pkgPath, "utf8"));
  } catch (error) {
    return { dirName, errors: [`package.json 解析失败：${error.message}`] };
  }

  if (!pkg.name) {
    errors.push("package.json 缺少 name 字段");
  } else if (pkg.name !== dirName) {
    errors.push(`package.json 的 name（${pkg.name}）与目录名（${dirName}）不一致`);
  }

  if (pkg.private !== true) {
    errors.push('package.json 应设置 "private": true');
  }

  if (!(await exists(join(appPath, "README.md")))) {
    errors.push("缺少 README.md");
  }

  if (await exists(join(appPath, "pnpm-lock.yaml"))) {
    errors.push("不应在 App 内维护 pnpm-lock.yaml，统一使用根目录锁文件");
  }

  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const internal = collectInternalDeps(pkg[field]);
    for (const item of internal) {
      errors.push(`${field} 中存在禁止的仓库内部依赖（${item}）`);
    }
  }

  return { dirName, errors };
}

const entries = await readdir(appsDir, { withFileTypes: true });
const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

if (dirs.length === 0) {
  console.log("apps/ 下暂时没有需要检查的 Demo。");
  process.exit(0);
}

const results = await Promise.all(dirs.map((dir) => checkApp(dir)));

let failed = 0;
for (const { dirName, errors } of results) {
  if (errors.length === 0) {
    console.log(`PASS  ${dirName}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${dirName}`);
    for (const error of errors) {
      console.log(`      - ${error}`);
    }
  }
}

console.log(`\n${results.length - failed}/${results.length} 个 App 通过检查。`);
process.exit(failed > 0 ? 1 : 0);

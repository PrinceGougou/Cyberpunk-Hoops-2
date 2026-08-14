import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const strict = process.argv.includes("--strict");
const root = process.cwd();
const schedulePath = join(root, "data", "schedule.json");
const requiredFiles = [
  "package.json",
  "app/layout.tsx",
  "app/api/schedule/route.ts",
  "lib/scheduleData.ts",
  "scripts/tencent_sports_data.py",
  "scripts/china_mens_basketball_data.py",
  "scripts/lol_esports_data.py",
  "scripts/schedule_pipeline.py"
];
const validLeagues = ["NBA", "CBA", "TEAM_CHINA", "LOL_LPL", "LOL_LCK", "LOL_INTL"];
const requiredAcquisitionKeys = [
  "NBA", "CBA", "CHINA_MEN_OFFICIAL",
  "LOL_LPL", "LOL_LCK", "LOL_WORLDS", "LOL_MSI", "LOL_FIRST_STAND"
];
const errors = [];
const warnings = [];

function report(label, value) {
  console.log(`${label.padEnd(16, " ")} ${value}`);
}

for (const file of requiredFiles) {
  try {
    await stat(join(root, file));
  } catch {
    errors.push(`缺少必要文件：${file}`);
  }
}

const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor < 18 || (nodeMajor === 18 && nodeMinor < 18)) {
  errors.push(`Node.js ${process.versions.node} 过旧，需要 18.18.0 或更高版本`);
}

report("Node.js", process.versions.node);
report("运行目录", root);

try {
  const payload = JSON.parse(await readFile(schedulePath, "utf8"));
  const matches = Array.isArray(payload.matches) ? payload.matches : [];
  const ids = new Set();
  let invalidDates = 0;
  let invalidMatches = 0;
  let duplicateIds = 0;
  let upcoming = 0;

  for (const match of matches) {
    if (!match?.id || !match?.homeTeam?.nameZh || !match?.awayTeam?.nameZh ||
        !validLeagues.includes(match?.league) ||
        !["UPCOMING", "LIVE", "FINISHED"].includes(match?.status)) {
      invalidMatches += 1;
    }
    if (!Number.isFinite(new Date(match?.startsAt).getTime())) invalidDates += 1;
    if (ids.has(match?.id)) duplicateIds += 1;
    ids.add(match?.id);
    if (match?.status === "UPCOMING") upcoming += 1;
  }

  const generatedAt = new Date(payload.generatedAt).getTime();
  const ageHours = Number.isFinite(generatedAt) ? (Date.now() - generatedAt) / 3_600_000 : Number.NaN;

  if (matches.length === 0) errors.push("data/schedule.json 中没有比赛");
  if (invalidDates > 0) errors.push(`存在 ${invalidDates} 条非法比赛时间`);
  if (invalidMatches > 0) errors.push(`存在 ${invalidMatches} 条结构不完整的比赛`);
  if (duplicateIds > 0) errors.push(`存在 ${duplicateIds} 个重复比赛 ID`);
  if (!Number.isFinite(ageHours)) errors.push("data/schedule.json 缺少合法 generatedAt");
  else if (ageHours > 36) warnings.push(`赛程缓存已 ${ageHours.toFixed(1)} 小时未更新`);
  if (upcoming === 0) warnings.push("当前缓存没有后续赛程，请确认是休赛期还是采集异常");
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    warnings.push(`最近一次采集记录了 ${payload.errors.length} 个来源错误`);
  }
  const acquisitionModes = Object.values(payload.acquisition || {}).reduce((result, source) => {
    const mode = source?.mode || "unknown";
    result[mode] = (result[mode] || 0) + 1;
    return result;
  }, {});
  const missingSources = requiredAcquisitionKeys.filter((key) => !payload.acquisition?.[key]);
  const leagueCounts = matches.reduce((result, match) => {
    result[match.league] = (result[match.league] || 0) + 1;
    return result;
  }, {});

  if (missingSources.length > 0) {
    const message = `缺少采集状态：${missingSources.join("、")}`;
    if (strict) errors.push(message);
    else warnings.push(message);
  }

  report("本地比赛", matches.length);
  report("后续赛程", upcoming);
  report("缓存时间", payload.generatedAt || "未知");
  report("联赛分布", Object.entries(leagueCounts).map(([league, count]) => `${league}:${count}`).join(" / "));
  if (Object.keys(acquisitionModes).length > 0) {
    report("采集方式", Object.entries(acquisitionModes).map(([mode, count]) => `${mode}:${count}`).join(" / "));
  }
} catch (error) {
  const message = `无法读取 data/schedule.json：${error instanceof Error ? error.message : String(error)}`;
  if (strict) errors.push(message);
  else warnings.push(message);
}

for (const warning of warnings) console.warn(`警告：${warning}`);
for (const error of errors) console.error(`错误：${error}`);

if (errors.length > 0) {
  console.error(`\n诊断失败：${errors.length} 个阻断问题，${warnings.length} 个警告。`);
  process.exitCode = 1;
} else {
  console.log(`\n诊断通过：${warnings.length} 个非阻断警告。`);
}

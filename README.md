# Cyberpunk Hoops

实时篮球赛程与媒体入口门户。项目使用 Next.js App Router、React、Tailwind CSS、Lucide React，并采用统一 `MatchData` 数据模型连接 NBA 官方 CDN 与 CBA/中国国家队自动抓取产物。

## Project Structure

```text
app/
  api/nba/route.ts          # NBA 官方 CDN Route Handler
  api/schedule/route.ts     # NBA + schedule.json 统一赛程接口
  globals.css               # 赛博朋克主题、霓虹边框、CRT 扫描线
  layout.tsx                # 根布局
  page.tsx                  # 首页入口
components/
  ScheduleDashboard.tsx     # 体育门户布局：ticker / hero / main grid / sidebar
  ScoreTicker.tsx           # 顶部横向滚动计分板
  HeroCarousel.tsx          # 主视觉轮播图
  PortalSidebar.tsx         # 排名、球星雷达、快速数据
  MatchCard.tsx             # 比赛卡片与外部媒体直达按钮
  RosterDrawer.tsx          # 主客队 active roster 与关注球星
data/
  scraper.config.json       # CBA/国家队抓取配置
  schedule.json             # 自动生成文件，不提交仓库
lib/
  types.ts                  # MatchData / Team / Player / Standings 类型
  normalizeSchedule.ts      # NBA CDN 数据标准化
  scheduleStats.ts          # 由赛果生成侧栏 standings
scripts/
  scrape_cba_schedule.py    # requests + BeautifulSoup 自动抓取脚本
```

## Local Run

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## Data Pipeline

### NBA Direct API

`app/api/nba/route.ts` 会请求官方 NBA CDN：

```text
https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json
```

并 fallback 到：

```text
https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json
```

返回统一 `ScheduleResponse`：

```ts
type ScheduleResponse = {
  generatedAt: string;
  matches: MatchData[];
  standings: StandingsRow[];
  errors?: string[];
};
```

### CBA / Team China Scraper

安装 Python 依赖：

```bash
pip install -r requirements.txt
```

运行自动抓取：

```bash
npm run scrape:schedules
```

脚本读取 `data/scraper.config.json`，无交互执行，并输出：

```text
data/schedule.json
```

`app/api/schedule/route.ts` 会合并 NBA CDN 与 `data/schedule.json`，前端只请求：

```text
/api/schedule
```

## MatchData

核心数据模型在 `lib/types.ts`：

```ts
type MatchData = {
  id: string;
  league: "NBA" | "CBA" | "TEAM_CHINA";
  startsAt: string;
  venue: string;
  status: "UPCOMING" | "LIVE" | "FINISHED";
  homeScore?: number;
  awayScore?: number;
  homeTeam: Team;
  awayTeam: Team;
  videoHighlightUrl: string;
  galleryUrl: string;
  broadcastProvider: string;
  sourceUrl: string;
};
```

## UI Features

- CBA 官网结构启发的信息架构：顶部比分条、主视觉轮播、主栏/侧栏布局
- 严格赛博朋克视觉：深色背景、霓虹青/洋红/紫、CRT scanline、发光边框
- ALL / NBA / CBA / TEAM CHINA 联盟筛选
- STAR FILTER 球星雷达筛选，关注球星保存在 `localStorage`
- MatchCard 使用标准 `<a target="_blank" rel="noopener noreferrer">` 直达官方视频/图片来源
- 移动端友好的响应式布局

## Deploy

Vercel:

```bash
npm run build
```

然后在 Vercel 导入仓库，Framework Preset 选择 `Next.js`。

Netlify:

项目包含 `netlify.toml` 和 `@netlify/plugin-nextjs`，导入仓库后使用默认构建命令即可。

## Production Notes

- 建议用 Vercel Cron 或 GitHub Actions 定时运行 `npm run scrape:schedules`。
- `data/schedule.json` 是生成文件，已在 `.gitignore` 中排除。
- NBA schedule route 使用 10 分钟 revalidate，适合公开 CDN 的赛程刷新节奏。
- CBA 官网为前端路由页面，脚本优先解析内嵌 JSON，失败后降级解析常见 DOM 赛程块。

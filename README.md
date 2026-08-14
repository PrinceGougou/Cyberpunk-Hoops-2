# Cyberpunk Hoops

一个可部署、可安装为 PWA App 的篮球与英雄联盟赛事聚合站。项目保留原有深色霓虹赛博朋克风格，使用 Next.js App Router、React、Tailwind CSS 和 Python 数据采集脚本。

生产网站：[https://codextest-blond.vercel.app](https://codextest-blond.vercel.app)

## 当前功能

- `LOL` 栏目：显示 Riot Games 的 LoL Esports 官网 LPL、LCK、MSI、First Stand、Worlds 赛程；
- `NBA / CBA` 栏目：赛程全部来自腾讯体育，不再请求 NBA 官方 CDN；
- `国家队` 栏目：只显示中国篮球协会官网发布的中国男篮比赛，不包含女篮、三人篮球和青年队；
- LOL 关注战队按 `LPL / LCK` 分组；
- NBA 关注球队按 `东部 / 西部` 分组，CBA 单独分组；
- 关注的球队或战队对应比赛自动置顶；
- 提供“哔哩哔哩英雄联盟直播”和“腾讯体育篮球直播”直达入口；
- 支持近日、后续赛程、最近赛果筛选，以及队名、简称、赛事阶段搜索；
- 展示数据来源、更新时间、覆盖范围和降级原因；
- 可作为 PWA 安装到 Windows、macOS、Android、iPhone 主屏幕；
- 赛程只在当前页面内存中使用，不写入浏览器持久业务缓存；
- 提供 `/api/health`、`npm run doctor`、数据校验和 GitHub Actions 定时更新。

## 数据来源

| 内容 | 来源 | 采集位置 |
| --- | --- | --- |
| NBA、CBA | [腾讯体育赛程](https://sports.qq.com/kbsweb/) | `scripts/tencent_sports_data.py` |
| 中国男篮 | [中国篮球协会官网](https://www.cba.net.cn/gjdgjnl/index.jhtml) | `scripts/china_mens_basketball_data.py` |
| LPL、LCK、国际 LOL 赛事 | [LoL Esports 官网](https://lolesports.com/en-US/) | `scripts/lol_esports_data.py` |
| LOL 观看入口 | [哔哩哔哩英雄联盟直播](https://live.bilibili.com/lol) | 页面外链，不抓取视频 |
| 篮球观看入口 | [腾讯体育篮球直播](https://sports.qq.com/kbsweb/) | 页面外链，不抓取视频 |

`scripts/schedule_pipeline.py` 合并腾讯篮球、中国篮协男篮和 Riot LOL 三类数据并生成 `data/schedule.json`。国际赛事只展示官网已经公布的具体对阵；例如官网尚未发布新一届 Worlds 对阵时，项目不会用旧年份数据冒充新赛程。

## 本机运行

### 环境

- Node.js `18.18.0` 或更高版本；
- Python 3.11 或更高版本；
- 能访问 npm、Python 软件源；
- 更新数据时需要能访问 `matchweb.sports.qq.com`、`www.cba.net.cn` 和 `esports-api.lolesports.com`。

### 安装与启动

```bash
npm install
python -m pip install -r requirements.txt
npm run scrape:schedules
npm run dev
```

浏览器打开 `http://localhost:3000`。终端窗口关闭、电脑休眠或关机后，本地网站会停止。

如果临时不能访问数据来源，可以跳过抓取并直接运行 `npm run dev`，网站会读取仓库中已有的 `data/schedule.json`，并如实标记数据是否过期。

## 网站操作

1. 用 `LOL / NBA / CBA / 国家队` 切换赛事栏目；
2. LOL 栏目可在关注栏选择 LPL、LCK 战队；
3. NBA 栏目可分别选择东部、西部球队；CBA 栏目单独选择 CBA 球队；
4. 用 `近日 / 后续赛程 / 最近赛果` 切换时间范围；
5. 使用搜索框查找球队、战队、简称、场馆或赛事阶段；
6. 点击比赛卡片两侧的星标进行关注，相关比赛将置顶；
7. 展开比赛卡片查看来源与外部视频入口；
8. 点击页面上的两个直播按钮跳转到哔哩哔哩或腾讯体育；
9. 查看侧栏数据源状态：绿色为正常，黄色为部分栏目不可用或正在使用缓存。

页面每 60 秒重新请求一次站内 API，但只在页面可见且网络在线时执行。它是赛程聚合站，不是秒级比分系统；真实更新频率取决于采集任务，默认 GitHub Actions 每 2 小时生成一次数据。

## 作为 App 使用

这是 PWA，不是单独的原生 APK 或 IPA。

- Windows / macOS / Android：用 Chrome 或 Edge 打开生产网站，点击“安装 APP”；
- iPhone / iPad：用 Safari 打开，选择“分享 → 添加到主屏幕”；
- 安装后可从桌面图标独立打开；
- 每次打开仍需联网请求网站接口；
- 关闭页面或 App 后，当前赛程数组会被浏览器释放。

开发模式不注册 Service Worker。要完整测试安装能力，请使用 HTTPS 生产网站，或运行：

```bash
npm run build
npm run start
```

## 缓存与设备空间

- 浏览器使用 `fetch("/api/schedule", { cache: "no-store" })` 获取赛程；
- React 只保留当前一份比赛数组，刷新时直接替换；
- `public/sw.js` 不缓存比赛、接口响应或页面，并会清理旧版本业务 Cache Storage；
- `localStorage` 只保存关注 ID 和扫描线开关，通常只有几 KB；
- JS、字体、图标可能由浏览器按普通静态资源策略短期缓存，但不会不断堆积历史赛程；
- 服务端/CDN 最多保留 5 分钟共享响应，它不占用访客设备的持久空间。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发网站 |
| `npm run scrape:schedules` | 抓取腾讯 NBA/CBA、中国篮协男篮和 Riot LOL 赛程 |
| `npm run doctor` | 检查运行环境、文件、数据结构、来源状态和缓存年龄 |
| `npm run check:data` | 严格校验所有篮球与 LOL 数据 |
| `npm run lint` | 检查 React、Next.js、TypeScript 代码规范 |
| `npm run build` | 构建生产版本并执行类型检查 |
| `npm run start` | 启动已经构建的生产网站 |
| `npm run check` | 依次执行 Lint、数据校验和生产构建 |

## API

```text
GET /api/schedule   腾讯 NBA/CBA + 中国篮协男篮 + LoL Esports 赛程
GET /api/nba        仅返回腾讯体育 NBA 赛程
GET /api/health     站点健康、比赛数量和数据来源状态
```

`/api/health` 的状态：

- `ok`：有比赛且全部来源新鲜；
- `degraded`：仍可展示，但至少一个来源使用历史缓存或部分栏目不可用；
- `unavailable`：没有可展示比赛，HTTP 状态码为 `503`。

## 部署

推荐使用 GitHub + Vercel：

1. 本机执行 `npm run scrape:schedules` 和 `npm run check`；
2. 提交代码与 `data/schedule.json` 到 GitHub；
3. 在 Vercel 导入仓库并选择 Next.js；
4. 在 GitHub Actions 中手动运行一次 `Auto-refresh schedule data`；
5. 确认工作流具有 `contents: write` 权限；
6. 以后 GitHub 每 2 小时抓取数据并提交，Vercel 在新提交后自动部署。

部署到 Vercel 后不需要个人电脑持续开机。若只运行 `npm run dev`，则必须让电脑、终端和网络一直保持在线。

## 网络要求

| 场景 | 所需网络 |
| --- | --- |
| 安装依赖 | 本机 → npm、Python 软件源 |
| 手动/自动抓取 NBA/CBA | 采集环境 → `matchweb.sports.qq.com` |
| 手动/自动抓取中国男篮 | 采集环境 → `www.cba.net.cn` |
| 手动/自动抓取 LOL | 采集环境 → `esports-api.lolesports.com` |
| 普通访问 | 浏览器 → 已部署的网站域名 |
| 点击直播入口 | 浏览器 → `live.bilibili.com` 或 `sports.qq.com` |

访客不需要直接访问采集接口，因为页面读取的是项目生成的统一赛程文件。不同地区或云平台可能限制腾讯或 Riot 接口，因此应查看数据来源状态和 GitHub Actions 日志。

## 当前不足

1. 腾讯、中国篮协或 Riot 接口字段与公开访问策略变化时，采集器需要维护；
2. 国家队栏目只覆盖中国篮协官网国家男篮赛事页已发布的单场比赛；
3. Riot 官网尚未公布的国际赛事具体对阵无法提前展示；
4. 默认两小时更新一次，不适合要求秒级比分的场景；
5. 没有账号与数据库，关注数据只存在当前浏览器，换设备或清理浏览器数据后会丢失；
6. 为避免设备积累缓存，App 断网后不会展示旧赛程；
7. 当前没有推送通知、后台管理、访问分析、错误告警和内容审核系统；
8. GitHub 定时提交 JSON 会增加 Git 历史和部署次数，高流量项目应迁移到数据库或独立数据服务；
9. 页面只提供官方或平台入口，不存储、转播视频，也不代表拥有赛事商标或商业使用授权。

## 学习文档

- [整站逻辑、函数索引与技术路线](docs/PROJECT_TECHNICAL_ROUTE.md)
- [网站、App、部署、运营与运行条件](docs/USAGE_AND_DEPLOYMENT.md)

上线前至少执行：

```bash
npm run check
```

import { ExternalLink, Gamepad2, Radio } from "lucide-react";

const WATCH_LINKS = [
  {
    label: "哔哩哔哩英雄联盟直播",
    href: "https://live.bilibili.com/lol",
    icon: Gamepad2,
    className: "border-magpunk/30 text-pink-300 hover:border-magpunk/70 hover:bg-magpunk/10"
  },
  {
    label: "腾讯体育篮球直播",
    href: "https://sports.qq.com/kbsweb/",
    icon: Radio,
    className: "border-cyan-400/30 text-cyan-300 hover:border-cyan-300 hover:bg-cyan-400/10"
  }
] as const;

export function WatchLinks() {
  return (
    <nav aria-label="赛事直播入口" className="mb-4 grid gap-2 sm:grid-cols-2">
      {WATCH_LINKS.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex min-h-11 items-center justify-between border bg-black/40 px-3 text-xs font-black transition ${item.className}`}
          >
            <span className="inline-flex items-center gap-2">
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </span>
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </a>
        );
      })}
    </nav>
  );
}

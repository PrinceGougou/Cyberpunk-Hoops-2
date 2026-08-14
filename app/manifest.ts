import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cyberpunk Hoops 篮球与 LOL 赛程中心",
    short_name: "Cyber Hoops",
    description: "查看腾讯 NBA/CBA、中国篮协男篮与 LPL、LCK、国际英雄联盟赛程。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#080b12",
    theme_color: "#00f0ff",
    lang: "zh-CN",
    categories: ["sports", "entertainment"],
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/app-icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}

"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, Wifi, WifiOff, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true;
}

export function AppStatusControls() {
  const [online, setOnline] = useState(true);
  const [standalone, setStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHint, setShowInstallHint] = useState(false);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateConnection = () => setOnline(navigator.onLine);
    const updateDisplayMode = () => setStandalone(isStandaloneMode());
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const markInstalled = () => {
      setStandalone(true);
      setInstallPrompt(null);
      setShowInstallHint(false);
    };

    updateConnection();
    updateDisplayMode();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);
    displayMode.addEventListener("change", updateDisplayMode);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
      displayMode.removeEventListener("change", updateDisplayMode);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      setShowInstallHint((current) => !current);
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="relative flex flex-wrap items-center justify-end gap-2">
      <span
        role="status"
        className={`inline-flex min-h-9 items-center gap-2 border bg-black/40 px-3 text-[0.65rem] font-bold ${
          !online ? "border-amber-400/30 text-amber-300" : "border-emerald-400/20 text-emerald-300/70"
        }`}
      >
        {!online ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
        {online ? "网络在线" : "网络离线"}
      </span>

      {standalone ? (
        <span className="inline-flex min-h-9 items-center gap-2 border border-cyan-400/30 bg-cyan-400/10 px-3 text-[0.65rem] font-black text-cyan-300">
          <Smartphone className="h-3.5 w-3.5" /> APP 模式
        </span>
      ) : (
        <button
          type="button"
          aria-expanded={showInstallHint}
          onClick={installApp}
          className="inline-flex min-h-9 items-center gap-2 border border-cyan-400/20 bg-black/40 px-3 text-[0.65rem] font-bold text-cyan-300/70 transition hover:border-cyan-300/50 hover:text-cyan-200"
        >
          <Download className="h-3.5 w-3.5" />
          安装 APP
        </button>
      )}

      {showInstallHint && !standalone && (
        <div className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] border border-cyan-400/30 bg-[#080b12]/95 p-3 text-xs leading-5 text-white/60 shadow-cyan backdrop-blur">
          <button
            type="button"
            aria-label="关闭安装说明"
            onClick={() => setShowInstallHint(false)}
            className="absolute right-2 top-2 text-white/30 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="pr-5 font-bold text-cyan-300">把网站装到桌面或手机</p>
          <p className="mt-1">Chrome / Edge：打开浏览器菜单，选择“安装应用”。iPhone：用 Safari 打开，点击“分享 → 添加到主屏幕”。</p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";

/**
 * `beforeinstallprompt` is Chromium-only (Chrome/Edge desktop & Android) and
 * not in lib.dom.d.ts yet, so it's typed by hand here.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !("MSStream" in window);
}

/**
 * Exposes the browser's native "Install app" prompt (Chrome/Edge desktop
 * and Android). Firefox and Safari never fire `beforeinstallprompt` — on
 * those, `canInstall` just stays false and callers should hide the button
 * (users install manually there: Safari's File > Add to Dock, iOS's Share
 * > Add to Home Screen).
 */
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setDeferredEvent(null);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredEvent) return;

    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
    }

    setDeferredEvent(null);
  }

  return {
    installed,
    canInstall: Boolean(deferredEvent) && !installed,
    // Safari (iOS and macOS) never fires `beforeinstallprompt`, so
    // `canInstall` stays false there forever — surface a manual hint instead.
    showIOSHint: !installed && isIOS() && !isStandalone(),
    promptInstall,
  };
}

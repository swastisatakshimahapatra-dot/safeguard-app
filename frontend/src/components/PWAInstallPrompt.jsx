import { useState, useEffect } from "react";
import { FiDownload, FiX, FiSmartphone } from "react-icons/fi";
import { MdAddToHomeScreen } from "react-icons/md";

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // ✅ Check if iOS
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // ✅ Check if already installed
    const isInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isInstalled) {
      localStorage.setItem("safeguard_pwa_installed", "true");
      return;
    }

    // ✅ Check if user dismissed before
    const dismissed = localStorage.getItem("safeguard_pwa_dismissed");
    if (dismissed) return;

    // ✅ Android - listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 10 seconds
      setTimeout(() => setShowPrompt(true), 10000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // ✅ iOS - show instructions after 10 seconds
    if (iOS && !isInstalled) {
      setTimeout(() => setShowPrompt(true), 10000);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("✅ PWA installed");
      localStorage.setItem("safeguard_pwa_installed", "true");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("safeguard_pwa_dismissed", "true");
  };

  if (!showPrompt) return null;

  // ✅ iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#1A1A2E]">
              Install SafeGuard
            </h3>
            <button
              onClick={() => {
                setShowIOSInstructions(false);
                setShowPrompt(false);
              }}
              className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500"
            >
              <FiX />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-blue-700 font-semibold text-sm mb-3">
                📱 How to Install on iPhone:
              </p>
              <ol className="text-blue-600 text-sm space-y-2 list-decimal list-inside">
                <li>
                  Tap the <strong>Share button</strong> (□↑) at the bottom
                </li>
                <li>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </li>
                <li>
                  Tap <strong>"Add"</strong> in the top right
                </li>
                <li>SafeGuard icon will appear on your home screen!</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-green-700 text-xs">
                ✅ After installing, you can activate SOS by pressing{" "}
                <strong>Volume Button 5 times</strong> even from lock screen!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowIOSInstructions(false);
              setShowPrompt(false);
              localStorage.setItem("safeguard_pwa_dismissed", "true");
            }}
            className="w-full mt-6 py-3 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  // ✅ Install Prompt Banner
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#0F3460] rounded-2xl p-5 shadow-2xl border border-pink-500/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#E91E8C] to-pink-700 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MdAddToHomeScreen className="text-white text-2xl" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-bold text-sm mb-1">
              Install SafeGuard
            </h4>
            <p className="text-gray-300 text-xs">
              Add to home screen for quick emergency access & offline alerts
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#E91E8C] to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm"
          >
            <FiDownload />
            {isIOS ? "How to Install" : "Install Now"}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-sm"
          >
            Later
          </button>
        </div>

        <p className="text-gray-400 text-xs mt-3 text-center">
          🔊 Press Volume Button 5x for emergency SOS
        </p>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;

import { X } from "lucide-react";
import { useEffect } from "react";
import { IconButton } from "../components/IconButton";
import { useUiStore } from "../store/uiStore";

export function Toast() {
  const notice = useUiStore((state) => state.notice);
  const setNotice = useUiStore((state) => state.setNotice);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  if (!notice) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-ink shadow-2xl"
    >
      <span className="max-w-[52ch] truncate">{notice}</span>
      <IconButton label="Dismiss" onClick={() => setNotice(null)} className="h-6 w-6">
        <X size={14} />
      </IconButton>
    </div>
  );
}

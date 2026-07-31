import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwa } from "@/pwa/PwaContext";

interface PwaInstallMenuActionProps {
  className?: string;
  compact?: boolean;
}

export default function PwaInstallMenuAction({
  className,
  compact = false,
}: PwaInstallMenuActionProps) {
  const { showPersistentInstallAction, canInstall, install, openHelp } = usePwa();

  if (!showPersistentInstallAction) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "default"}
      className={className}
      onClick={() => {
        if (canInstall) {
          void install();
        } else {
          openHelp();
        }
      }}
      aria-label="Install Focus Flow"
      title="Install Focus Flow"
    >
      <Download size={18} aria-hidden="true" />
      {compact ? <span className="sr-only">Install Focus Flow</span> : <span>Install app</span>}
    </Button>
  );
}

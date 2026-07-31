import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwa } from "@/pwa/PwaContext";
import { useLocale } from "@/contexts/LocaleContext";

interface PwaInstallMenuActionProps {
  className?: string;
  compact?: boolean;
}

export default function PwaInstallMenuAction({
  className,
  compact = false,
}: PwaInstallMenuActionProps) {
  const { showPersistentInstallAction, canInstall, install, openHelp } =
    usePwa();
  const { t } = useLocale();

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
      aria-label={t("pwa.installLabel")}
      title={t("pwa.installLabel")}
    >
      <Download size={18} aria-hidden="true" />
      {compact ? (
        <span className="sr-only">{t("pwa.installLabel")}</span>
      ) : (
        <span>{t("pwa.install")}</span>
      )}
    </Button>
  );
}

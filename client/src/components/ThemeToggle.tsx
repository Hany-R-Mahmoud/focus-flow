import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";
import { useLocale } from "@/contexts/LocaleContext";

interface ThemeToggleProps {
  showLabel?: boolean;
}

export default function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size={showLabel ? "default" : "icon"}
      className={showLabel ? "min-h-11 px-3" : "size-11"}
      onClick={toggleTheme}
      aria-label={isDark ? t("theme.switchLight") : t("theme.switchDark")}
      aria-pressed={isDark}
      title={isDark ? t("theme.switchLight") : t("theme.switchDark")}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      {showLabel && <span>{isDark ? t("theme.light") : t("theme.dark")}</span>}
    </Button>
  );
}

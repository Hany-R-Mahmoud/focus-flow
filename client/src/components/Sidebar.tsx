import { useLocation } from "wouter";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Clock,
  History,
  Calendar,
  Settings,
  Play,
  Users,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import PwaInstallMenuAction from "./PwaInstallMenuAction";
import MobileBottomNav from "./MobileBottomNav";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const [location, setLocation] = useLocation();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { label: "Templates", href: "/templates", icon: <Clock size={20} /> },
    {
      label: "Group Sessions",
      href: "/group-sessions",
      icon: <Users size={20} />,
    },
    { label: "History", href: "/history", icon: <History size={20} /> },
    {
      label: "Daily Review",
      href: "/daily-review",
      icon: <Calendar size={20} />,
    },
    {
      label: "Weekly Review",
      href: "/weekly-review",
      icon: <Calendar size={20} />,
    },
    { label: "Settings", href: "/settings", icon: <Settings size={20} /> },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-card border border-teal-100 dark:border-border flex items-center justify-center overflow-hidden">
              <img
                src="/brand/focus-flow-mark.png"
                alt=""
                className="w-8 h-8 object-contain"
              />
            </div>
            <h1 className="text-lg font-bold text-foreground">Focus Flow</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <Button
              asChild
              key={item.href}
              variant={isActive(item.href) ? "default" : "ghost"}
              className="w-full justify-start gap-3"
            >
              <a
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </Button>
          ))}
        </nav>

        <div className="p-4 space-y-2 border-t border-border">
          <ThemeToggle showLabel />
          <PwaInstallMenuAction className="w-full justify-start gap-3" />
          <Button
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setLocation("/create-group-session")}
          >
            <Users size={18} />
            <span>Create Group Session</span>
          </Button>
          <Button
            className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => setLocation("/session/new")}
          >
            <Play size={18} />
            <span>Start Session</span>
          </Button>
        </div>
      </aside>

      <MobileBottomNav />

      <PwaInstallMenuAction
        compact
        className="fixed bottom-[8rem] left-4 z-30 rounded-full bg-card shadow-lg md:hidden"
      />
    </>
  );
}

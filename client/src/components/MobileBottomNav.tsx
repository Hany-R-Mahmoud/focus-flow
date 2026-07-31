import {
  Calendar,
  Clock,
  History,
  LayoutDashboard,
  MoreHorizontal,
  Settings,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const primaryNavItems: MobileNavItem[] = [
  { label: "Home", href: "/dashboard", icon: <LayoutDashboard /> },
  { label: "Templates", href: "/templates", icon: <Clock /> },
  { label: "Groups", href: "/group-sessions", icon: <Users /> },
  { label: "History", href: "/history", icon: <History /> },
];

const moreNavItems: MobileNavItem[] = [
  { label: "Daily Review", href: "/daily-review", icon: <Calendar /> },
  { label: "Weekly Review", href: "/weekly-review", icon: <Calendar /> },
  { label: "Settings", href: "/settings", icon: <Settings /> },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  const isActive = (href: string) => location.startsWith(href);
  const isMoreActive = moreNavItems.some(item => isActive(item.href));

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85 pb-[env(safe-area-inset-bottom)] md:hidden">
      <nav aria-label="Mobile navigation" className="grid grid-cols-5">
        {primaryNavItems.map(item => (
          <Button
            asChild
            key={item.href}
            variant={isActive(item.href) ? "secondary" : "ghost"}
            className="h-16 min-w-0 flex-col gap-1 rounded-none px-1 text-muted-foreground"
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            <a href={item.href}>
              <span
                className={
                  isActive(item.href)
                    ? "text-[var(--color-teal-foreground)]"
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span className="max-w-full truncate text-[10px] leading-4">
                {item.label}
              </span>
            </a>
          </Button>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={isMoreActive ? "secondary" : "ghost"}
              className="h-16 min-w-0 flex-col gap-1 rounded-none px-1 text-muted-foreground"
              aria-label="More navigation options"
              aria-current={isMoreActive ? "page" : undefined}
            >
              <span
                className={
                  isMoreActive
                    ? "text-[var(--color-teal-foreground)]"
                    : undefined
                }
              >
                <MoreHorizontal />
              </span>
              <span className="text-[10px] leading-4">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={8}
            className="mb-1 mr-2 min-w-48"
          >
            {moreNavItems.map(item => (
              <DropdownMenuItem key={item.href} asChild>
                <a
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}

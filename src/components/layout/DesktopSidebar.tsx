import { LayoutDashboard, Flag, MapPin, User, LogOut, Crosshair } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/overview", icon: Crosshair, label: "Overview" },
  { to: "/rounds", icon: Flag, label: "Rounds" },
  { to: "/courses", icon: MapPin, label: "Courses" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function DesktopSidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r bg-card">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold font-display tracking-tight text-primary">
          ⛳ Pinpoint
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            activeClassName="bg-primary/10 text-primary"
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

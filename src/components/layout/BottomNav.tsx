import { LayoutDashboard, Flag, MapPin, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const tabs = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/rounds", icon: Flag, label: "Rounds" },
  { to: "/courses", icon: MapPin, label: "Courses" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground transition-colors tap-target"
            activeClassName="text-primary"
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

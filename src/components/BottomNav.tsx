import { useState } from "react";
import { CalendarCheck, Users, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import LogInteractionSheet from "@/components/LogInteractionSheet";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Bug 1: Auto-populate contact from current screen
  const contactMatch = location.pathname.match(/^\/contact\/(.+)$/);
  const contextContactId = contactMatch ? contactMatch[1] : undefined;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card will-change-transform [transform:translate3d(0,0,0)] [backface-visibility:hidden]">
        <div className="flex items-center justify-around max-w-lg mx-auto h-16">
          <button
            onClick={() => navigate("/")}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <CalendarCheck size={22} />
            <span className="text-xs font-medium">Today</span>
          </button>

          <div className="flex flex-col items-center gap-1 px-4 py-2">
            <button
              onClick={() => setLogSheetOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
            >
              <Plus size={22} />
            </button>
          </div>

          <button
            onClick={() => navigate("/contacts")}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              isActive("/contacts") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Users size={22} />
            <span className="text-xs font-medium">Contacts</span>
          </button>
        </div>
      </nav>

      <LogInteractionSheet
        open={logSheetOpen}
        onOpenChange={setLogSheetOpen}
        preselectedContactId={contextContactId}
      />
    </>
  );
};

export default BottomNav;

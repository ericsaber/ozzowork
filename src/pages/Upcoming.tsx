import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";

const Upcoming = () => {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: items, isLoading } = useQuery({
    queryKey: ["follow-ups-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*, contacts(*)")
        .eq("status", "active")
        .gt("planned_date", today)
        .order("planned_date", { ascending: true });
      if (error) throw error;
      console.log("[Upcoming] follow_ups fetched:", data?.length);
      const seen = new Set<string>();
      return (data || []).filter((item: any) => {
        if (seen.has(item.contact_id)) return false;
        seen.add(item.contact_id);
        return true;
      });
    },
  });

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
        <ArrowLeft size={18} /><span className="text-sm">Back</span>
      </button>
      <h1 className="text-2xl font-heading text-foreground mb-6">Upcoming</h1>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-secondary animate-pulse" />)}</div>
      ) : items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item: any) => {
            const name = item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}`.trim() : "Unknown";
            return (
              <button key={item.id} onClick={() => navigate(`/contact/${item.contact_id}`)} className="w-full text-left bg-card rounded-lg border border-border p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{name}</h3>
                  {item.contacts?.company && <p className="text-sm text-muted-foreground">{item.contacts.company}</p>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-3">{format(parseISO(item.planned_follow_up_date), "MMM d")}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">No upcoming follow-ups.</p>
      )}
    </div>
  );
};

export default Upcoming;

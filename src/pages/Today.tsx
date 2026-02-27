import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FollowupCard from "@/components/FollowupCard";
import { format } from "date-fns";

const Today = () => {
  const { data: followups, isLoading } = useQuery({
    queryKey: ["followups-today"],
    queryFn: async () => {
      // Get all interactions with a follow_up_date <= today, grouped by contact
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: interactions, error } = await supabase
        .from("interactions")
        .select("*, contacts(*)")
        .lte("follow_up_date", today)
        .order("follow_up_date", { ascending: true });

      if (error) throw error;

      // Dedupe by contact_id, keep the most recent follow_up
      const contactMap = new Map<string, any>();
      for (const interaction of interactions || []) {
        const existing = contactMap.get(interaction.contact_id);
        if (!existing || interaction.follow_up_date > existing.follow_up_date) {
          contactMap.set(interaction.contact_id, interaction);
        }
      }

      return Array.from(contactMap.values());
    },
  });

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-heading text-foreground mb-1">Today</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {format(new Date(), "EEEE, MMMM d")}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      ) : followups && followups.length > 0 ? (
        <div className="space-y-3">
          {followups.map((item: any) => (
            <FollowupCard
              key={item.id}
              contactId={item.contact_id}
              name={item.contacts?.name || "Unknown"}
              company={item.contacts?.company}
              lastNote={item.note}
              followUpDate={item.follow_up_date}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg font-heading italic">
            All clear for today
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            No follow-ups due. Nice work.
          </p>
        </div>
      )}
    </div>
  );
};

export default Today;

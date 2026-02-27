import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Phone, Mail, Plus } from "lucide-react";
import InteractionItem from "@/components/InteractionItem";
import { Button } from "@/components/ui/button";

const ContactHistory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: contact } = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: interactions, isLoading } = useQuery({
    queryKey: ["interactions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .eq("contact_id", id!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const initials = contact?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-muted-foreground mb-4"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>

      {contact && (
        <div className="text-center mb-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-semibold text-secondary-foreground">{initials}</span>
          </div>
          <h1 className="text-2xl font-heading text-foreground">{contact.name}</h1>
          {contact.company && (
            <p className="text-muted-foreground text-sm">{contact.company}</p>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/log?contact=${id}`)}
            >
              <Plus size={16} className="mr-1" />
              Log
            </Button>
            {contact.phone && (
              <Button size="sm" variant="secondary" asChild>
                <a href={`tel:${contact.phone}`}>
                  <Phone size={16} className="mr-1" />
                  Call
                </a>
              </Button>
            )}
            {contact.email && (
              <Button size="sm" variant="secondary" asChild>
                <a href={`mailto:${contact.email}`}>
                  <Mail size={16} className="mr-1" />
                  Email
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-border pt-4">
        <h2 className="text-lg font-heading text-foreground mb-3">History</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
            ))}
          </div>
        ) : interactions && interactions.length > 0 ? (
          <div className="divide-y divide-border">
            {interactions.map((item) => (
              <InteractionItem
                key={item.id}
                date={item.date}
                type={item.type}
                note={item.note}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No interactions yet
          </p>
        )}
      </div>
    </div>
  );
};

export default ContactHistory;

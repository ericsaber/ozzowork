import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Phone, Mail, Plus, Pencil, Trash2, X } from "lucide-react";
import InteractionItem from "@/components/InteractionItem";
import EditInteractionDialog from "@/components/EditInteractionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, parseISO, isBefore, startOfToday } from "date-fns";

const ContactHistory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", company: "", phone: "", email: "" });
  const [editingInteraction, setEditingInteraction] = useState<any | null>(null);

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

  const updateContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("contacts")
        .update({
          first_name: form.first_name,
          last_name: form.last_name,
          company: form.company || null,
          phone: form.phone || null,
          email: form.email || null,
        })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setEditing(false);
      toast.success("Contact updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contacts").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
      navigate("/contacts", { replace: true });
    },
    onError: (e) => toast.error(e.message),
  });

  const startEditing = () => {
    if (contact) {
      setForm({
        first_name: contact.first_name,
        last_name: contact.last_name,
        company: contact.company || "",
        phone: contact.phone || "",
        email: contact.email || "",
      });
      setEditing(true);
    }
  };

  const fullName = contact ? `${contact.first_name} ${contact.last_name}`.trim() : "";
  const initials = fullName
    ? fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const today = startOfToday();
  const historyItems = interactions?.filter((i) => {
    const d = parseISO(i.date);
    return isBefore(d, today) || format(d, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  }) || [];

  const upcomingItems = interactions?.filter((i) => {
    return i.follow_up_date && !isBefore(parseISO(i.follow_up_date), today);
  }) || [];

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
          {editing ? (
            <div className="bg-card rounded-lg border border-border p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Edit Contact</h3>
                <button onClick={() => setEditing(false)} className="text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="First Name *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="bg-background" />
                  <Input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="bg-background" />
                </div>
                <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-background" />
                <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-background" />
                <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background" />
                <Button onClick={() => updateContact.mutate()} disabled={!form.first_name || updateContact.isPending} className="w-full">
                  {updateContact.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-semibold text-secondary-foreground">{initials}</span>
              </div>
              <h1 className="text-2xl font-heading text-foreground">{fullName}</h1>
              {contact.company && (
                <p className="text-muted-foreground text-sm">{contact.company}</p>
              )}
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => navigate(`/log?contact=${id}`)}>
                  <Plus size={16} className="mr-1" /> Log
                </Button>
                {contact.phone && (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={`tel:${contact.phone}`}><Phone size={16} className="mr-1" /> Call</a>
                  </Button>
                )}
                {contact.email && (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={`mailto:${contact.email}`}><Mail size={16} className="mr-1" /> Email</a>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={startEditing}>
                  <Pencil size={16} className="mr-1" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                      <Trash2 size={16} className="mr-1" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete contact?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {fullName} and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteContact.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>
      )}

      <div className="border-t border-border pt-4">
        <Tabs defaultValue="history">
          <TabsList className="w-full">
            <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
          </TabsList>
          <TabsContent value="history">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
                ))}
              </div>
            ) : historyItems.length > 0 ? (
              <div className="divide-y divide-border">
                {historyItems.map((item) => (
                  <InteractionItem
                    key={item.id}
                    date={item.date}
                    type={item.connect_type || item.planned_follow_up_type}
                    note={item.note}
                    followUpDate={item.follow_up_date}
                    onClick={() => setEditingInteraction(item)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No interactions yet</p>
            )}
          </TabsContent>
          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
                ))}
              </div>
            ) : upcomingItems.length > 0 ? (
              <div className="divide-y divide-border">
                {upcomingItems.map((item) => (
                  <InteractionItem
                    key={item.id}
                    date={item.date}
                    type={item.type}
                    note={item.note}
                    followUpDate={item.follow_up_date}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming follow-ups</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {editingInteraction && (
        <EditInteractionDialog
          interaction={editingInteraction}
          open={!!editingInteraction}
          onClose={() => setEditingInteraction(null)}
          contactId={id!}
        />
      )}
    </div>
  );
};

export default ContactHistory;

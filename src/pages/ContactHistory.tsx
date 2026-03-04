import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Phone, Mail, Plus, Pencil, Trash2, X } from "lucide-react";
import InteractionItem from "@/components/InteractionItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const ContactHistory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "" });

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
          name: form.name,
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
        name: contact.name,
        company: contact.company || "",
        phone: contact.phone || "",
        email: contact.email || "",
      });
      setEditing(true);
    }
  };

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
          {editing ? (
            <div className="bg-card rounded-lg border border-border p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Edit Contact</h3>
                <button onClick={() => setEditing(false)} className="text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background" />
                <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-background" />
                <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-background" />
                <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background" />
                <Button onClick={() => updateContact.mutate()} disabled={!form.name || updateContact.isPending} className="w-full">
                  {updateContact.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-semibold text-secondary-foreground">{initials}</span>
              </div>
              <h1 className="text-2xl font-heading text-foreground">{contact.name}</h1>
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
                        This will permanently delete {contact.name} and cannot be undone. Interaction history will remain.
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

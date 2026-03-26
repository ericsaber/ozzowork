import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X, UserPlus, Upload, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

const Contacts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", company: "", phone: "", email: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const addContact = useMutation({
    mutationFn: async (contactData?: { first_name: string; last_name: string; company: string; phone: string; email: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const d = contactData || form;
      const { error } = await supabase.from("contacts").insert({
        first_name: d.first_name,
        last_name: d.last_name,
        company: d.company || null,
        phone: d.phone || null,
        email: d.email || null,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setShowAdd(false);
      setForm({ first_name: "", last_name: "", company: "", phone: "", email: "" });
      toast.success("Contact added");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAllContacts = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      // Delete associated data first
      await supabase.from("follow_up_edits").delete().eq("user_id", user.id);
      await supabase.from("follow_ups").delete().eq("user_id", user.id);
      await supabase.from("interactions").delete().eq("user_id", user.id);
      await supabase.from("task_records").delete().eq("user_id", user.id);
      const { error } = await supabase.from("contacts").delete().eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("All contacts and associated data deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkAddContacts = useMutation({
    mutationFn: async (rows: { first_name: string; last_name: string; company: string; phone: string; email: string }[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const insertData = rows.map((r) => ({
        first_name: r.first_name,
        last_name: r.last_name,
        company: r.company || null,
        phone: r.phone || null,
        email: r.email || null,
        user_id: user.id,
      }));
      const { error } = await supabase.from("contacts").insert(insertData);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success(`${count} contact${count !== 1 ? "s" : ""} imported`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handlePickFromPhone = async () => {
    if ("contacts" in navigator && "ContactsManager" in window) {
      try {
        const props = ["name", "email", "tel"];
        const opts = { multiple: false };
        // @ts-ignore
        const pickedContacts = await navigator.contacts.select(props, opts);
        if (pickedContacts && pickedContacts.length > 0) {
          const picked = pickedContacts[0];
          const fullName = picked.name?.[0] || "Unknown";
          const parts = fullName.split(" ");
          const contactData = {
            first_name: parts[0] || "Unknown",
            last_name: parts.slice(1).join(" ") || "",
            company: "",
            phone: picked.tel?.[0] || "",
            email: picked.email?.[0] || "",
          };
          addContact.mutate(contactData);
        }
      } catch (e: any) {
        if (e.name !== "InvalidStateError" && e.name !== "NotAllowedError") {
          toast.error("Could not access contacts");
        }
      }
    } else {
      toast.info("Contact Picker is not supported on this device. Try importing from a CSV file instead.");
    }
  };

  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0].toLowerCase());

    const firstNameIdx = headers.findIndex((h) => h === "first name" || h === "first_name" || h === "firstname");
    const lastNameIdx = headers.findIndex((h) => h === "last name" || h === "last_name" || h === "lastname");
    const nameIdx = headers.findIndex((h) => h === "name" || h === "full name" || h === "fullname");
    const companyIdx = headers.findIndex((h) => h.includes("company") || h.includes("organization") || h.includes("org"));
    const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("tel") || h.includes("mobile"));
    const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("e-mail"));

    if (firstNameIdx === -1 && nameIdx === -1) {
      toast.error("CSV must have a 'First Name' or 'Name' column");
      return [];
    }

    const rows: { first_name: string; last_name: string; company: string; phone: string; email: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);

      let firstName = "";
      let lastName = "";

      if (firstNameIdx >= 0) {
        firstName = vals[firstNameIdx]?.trim() || "";
        lastName = lastNameIdx >= 0 ? vals[lastNameIdx]?.trim() || "" : "";
      } else if (nameIdx >= 0) {
        const full = vals[nameIdx]?.trim() || "";
        const parts = full.split(" ");
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }

      if (!firstName) continue;

      rows.push({
        first_name: firstName,
        last_name: lastName,
        company: companyIdx >= 0 ? vals[companyIdx]?.trim() || "" : "",
        phone: phoneIdx >= 0 ? vals[phoneIdx]?.trim() || "" : "",
        email: emailIdx >= 0 ? vals[emailIdx]?.trim() || "" : "",
      });
    }

    return rows;
  };

  const parseVCard = (text: string) => {
    const cards = text.split("BEGIN:VCARD").filter((c) => c.trim());
    const rows: { first_name: string; last_name: string; company: string; phone: string; email: string }[] = [];

    for (const card of cards) {
      const getField = (prefix: string) => {
        const match = card.match(new RegExp(`${prefix}[^:]*:(.+)`, "i"));
        return match ? match[1].trim() : "";
      };

      const fn = getField("FN");
      if (!fn) continue;
      const parts = fn.split(" ");

      rows.push({
        first_name: parts[0] || "",
        last_name: parts.slice(1).join(" ") || "",
        company: getField("ORG").split(";")[0],
        phone: getField("TEL"),
        email: getField("EMAIL"),
      });
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      let rows: { first_name: string; last_name: string; company: string; phone: string; email: string }[] = [];

      if (file.name.endsWith(".vcf") || file.name.endsWith(".vcard")) {
        rows = parseVCard(text);
      } else {
        rows = parseCSV(text);
      }

      if (rows.length === 0) {
        toast.error("No contacts found in file.");
        return;
      }

      bulkAddContacts.mutate(rows);
    };
    reader.readAsText(file);
  };

  const filtered = contacts?.filter(
    (c) => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      const q = search.toLowerCase();
      return fullName.includes(q) || (c.company && c.company.toLowerCase().includes(q));
    }
  );

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-heading text-foreground">Contacts</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="text-xs text-destructive underline">Delete All</button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your contacts and their associated interactions, follow-ups, and task records. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAllContacts.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteAllContacts.isPending ? "Deleting..." : "Delete Everything"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-card" />
      </div>

      <div className="flex gap-1.5 mb-4">
        <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs px-2.5" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> New Contact
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs px-2.5" onClick={handlePickFromPhone}>
          <UserPlus size={14} /> From Phone
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs px-2.5" onClick={handleFileImport}>
          <Upload size={14} /> From CSV
        </Button>
        <input ref={fileInputRef} type="file" accept=".csv,.vcf,.vcard" className="hidden" onChange={handleFileChange} />
      </div>

      {showAdd && (
        <div className="bg-card rounded-lg border border-border p-4 mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">New Contact</h3>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First Name *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="bg-background" />
              <Input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="bg-background" />
            </div>
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-background" />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-background" />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background" />
            <Button onClick={() => addContact.mutate(form)} disabled={!form.first_name || addContact.isPending} className="w-full">
              {addContact.isPending ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-1">
          {filtered.map((contact) => {
            const fullName = `${contact.first_name} ${contact.last_name}`.trim();
            const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <button
                key={contact.id}
                onClick={() => navigate(`/contact/${contact.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <span className="font-semibold text-secondary-foreground" style={{ fontSize: "13px" }}>{initials}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{fullName}</p>
                  {contact.company && <p className="text-xs text-muted-foreground">{contact.company}</p>}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12 text-sm">
          {search ? "No contacts found" : "No contacts yet"}
        </p>
      )}

    </div>
  );
};

export default Contacts;

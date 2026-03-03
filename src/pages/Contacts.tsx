import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X, UserPlus, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Contacts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const addContact = useMutation({
    mutationFn: async (contactData?: { name: string; company: string; phone: string; email: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const d = contactData || form;
      const { error } = await supabase.from("contacts").insert({
        name: d.name,
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
      setForm({ name: "", company: "", phone: "", email: "" });
      toast.success("Contact added");
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkAddContacts = useMutation({
    mutationFn: async (rows: { name: string; company: string; phone: string; email: string }[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const insertData = rows.map((r) => ({
        name: r.name,
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
    setShowImportMenu(false);
    // Use the Contact Picker API if available
    if ("contacts" in navigator && "ContactsManager" in window) {
      try {
        const props = ["name", "email", "tel"];
        const opts = { multiple: false };
        // @ts-ignore - Contact Picker API not yet in TS types
        const pickedContacts = await navigator.contacts.select(props, opts);
        if (pickedContacts && pickedContacts.length > 0) {
          const picked = pickedContacts[0];
          const contactData = {
            name: picked.name?.[0] || "Unknown",
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
    setShowImportMenu(false);
    fileInputRef.current?.click();
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

    const nameIdx = headers.findIndex((h) => h.includes("name") && !h.includes("company"));
    const companyIdx = headers.findIndex((h) => h.includes("company") || h.includes("organization") || h.includes("org"));
    const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("tel") || h.includes("mobile"));
    const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("e-mail"));

    if (nameIdx === -1) {
      toast.error("CSV must have a 'name' column");
      return [];
    }

    const rows: { name: string; company: string; phone: string; email: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Simple CSV parse (handles quoted fields)
      const vals = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map((v) =>
        v.trim().replace(/^"|"$/g, "")
      ) || lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));

      const name = vals[nameIdx]?.trim();
      if (!name) continue;

      rows.push({
        name,
        company: companyIdx >= 0 ? vals[companyIdx]?.trim() || "" : "",
        phone: phoneIdx >= 0 ? vals[phoneIdx]?.trim() || "" : "",
        email: emailIdx >= 0 ? vals[emailIdx]?.trim() || "" : "",
      });
    }

    return rows;
  };

  const parseVCard = (text: string) => {
    const cards = text.split("BEGIN:VCARD").filter((c) => c.trim());
    const rows: { name: string; company: string; phone: string; email: string }[] = [];

    for (const card of cards) {
      const getField = (prefix: string) => {
        const match = card.match(new RegExp(`${prefix}[^:]*:(.+)`, "i"));
        return match ? match[1].trim() : "";
      };

      const fn = getField("FN");
      if (!fn) continue;

      rows.push({
        name: fn,
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
      let rows: { name: string; company: string; phone: string; email: string }[] = [];

      if (file.name.endsWith(".vcf") || file.name.endsWith(".vcard")) {
        rows = parseVCard(text);
      } else {
        rows = parseCSV(text);
      }

      if (rows.length === 0) {
        toast.error("No contacts found in file. Check format (CSV with name column, or vCard).");
        return;
      }

      bulkAddContacts.mutate(rows);
    };
    reader.readAsText(file);
  };

  const filtered = contacts?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-heading text-foreground">Contacts</h1>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 bg-card"
        />
      </div>

      {/* Import actions */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          onClick={handlePickFromPhone}
        >
          <UserPlus size={14} />
          From Phone
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          onClick={handleFileImport}
        >
          <Upload size={14} />
          Import File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.vcf,.vcard"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {showAdd && (
        <div className="bg-card rounded-lg border border-border p-4 mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">New Contact</h3>
            <button onClick={() => setShowAdd(false)} className="text-muted-foreground">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-background"
            />
            <Input
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="bg-background"
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-background"
            />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-background"
            />
            <Button
              onClick={() => addContact.mutate(form)}
              disabled={!form.name || addContact.isPending}
              className="w-full"
            >
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
            const initials = contact.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <button
                key={contact.id}
                onClick={() => navigate(`/contact/${contact.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-semibold text-secondary-foreground">{initials}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{contact.name}</p>
                  {contact.company && (
                    <p className="text-xs text-muted-foreground">{contact.company}</p>
                  )}
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

      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default Contacts;

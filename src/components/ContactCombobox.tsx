import { useState, useRef, useEffect, useMemo } from "react";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
}

interface ContactComboboxProps {
  contacts: Contact[] | undefined;
  contactId: string;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

const ContactCombobox = ({ contacts, contactId, onSelect, onAddNew }: ContactComboboxProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync display text when contactId changes externally (e.g. after quick-add)
  const selected = contacts?.find((c) => c.id === contactId);
  useEffect(() => {
    if (selected) {
      setQuery(`${selected.first_name} ${selected.last_name}`.trim());
    }
  }, [selected]);

  const filtered = useMemo(() => {
    if (!contacts) return [];
    if (!query) return contacts;
    const q = query.toLowerCase();
    return contacts.filter((c) => {
      const name = `${c.first_name} ${c.last_name}`.toLowerCase();
      const company = (c.company || "").toLowerCase();
      return name.includes(q) || company.includes(q);
    });
  }, [contacts, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Clear input if nothing selected
        if (!contactId) setQuery("");
        else if (selected) setQuery(`${selected.first_name} ${selected.last_name}`.trim());
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contactId, selected]);

  const handleSelect = (id: string) => {
    onSelect(id);
    const c = contacts?.find((x) => x.id === id);
    if (c) setQuery(`${c.first_name} ${c.last_name}`.trim());
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const totalItems = filtered.length + 1; // +1 for "Add new contact"
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => (i + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => (i - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filtered.length) {
        handleSelect(filtered[focusedIndex].id);
      } else if (focusedIndex === filtered.length) {
        onAddNew();
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[focusedIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="Search contacts…"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setFocusedIndex(-1);
          // Clear selection if user edits
          if (contactId) onSelect("");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-[12px] border-[1.5px] border-[#e0dbd3] bg-[#f0ede8] px-[14px] py-[10px] text-[#18181a] placeholder:text-[#bbb] focus:outline-none focus:border-[#f0c4a8] transition-colors"
        style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}
      />

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-[12px] border-[1.5px] border-[#e0dbd3] bg-[#faf9f7] overflow-hidden"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,.10)", zIndex: 50 }}
        >
          <div ref={listRef} className="max-h-[200px] overflow-y-auto">
            {filtered.length === 0 && (
              <div
                className="px-[14px] py-[10px] text-[#bbb]"
                style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}
              >
                No contacts found
              </div>
            )}
            {filtered.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(c.id)}
                onMouseEnter={() => setFocusedIndex(i)}
                className={`w-full text-left px-[14px] py-[10px] transition-colors ${
                  focusedIndex === i ? "bg-[#fdf0e8]" : ""
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                <div className="text-[#18181a]" style={{ fontSize: "14px" }}>
                  {`${c.first_name} ${c.last_name}`.trim()}
                </div>
                {c.company && (
                  <div className="text-[#888] mt-0.5" style={{ fontSize: "12px" }}>{c.company}</div>
                )}
              </button>
            ))}
          </div>

          {/* Pinned "Add new contact" */}
          <div className="border-t border-[#e0dbd3]">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onAddNew();
                setOpen(false);
              }}
              onMouseEnter={() => setFocusedIndex(filtered.length)}
              className={`w-full text-left px-[14px] py-[10px] font-medium text-[#c8622a] transition-colors ${
                focusedIndex === filtered.length ? "bg-[#fdf0e8]" : ""
              }`}
              style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}
            >
              + Add new contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactCombobox;
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Megaphone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  type Notice,
  type NoticeType,
  adminCreateNotice,
  adminDeleteNotice,
  adminFetchNotices,
  adminUpdateNotice,
} from "@/lib/api";

const TYPES: { value: NoticeType; label: string; Icon: typeof Info }[] = [
  { value: "info", label: "Info", Icon: Info },
  { value: "success", label: "Success", Icon: CheckCircle2 },
  { value: "warning", label: "Warning", Icon: AlertTriangle },
  { value: "urgent", label: "Urgent", Icon: Megaphone },
];

const TYPE_COLOR: Record<NoticeType, string> = {
  info: "text-sky-300 border-sky-400/30 bg-sky-400/10",
  success: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  warning: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  urgent: "text-rose-300 border-rose-500/30 bg-rose-500/10",
};

export function NoticesManager() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetchNotices();
      setNotices(res.notices);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreated = (n: Notice) => {
    setNotices((prev) => [n, ...prev]);
    setShowForm(false);
    toast.success("Notice published");
  };

  const onToggle = async (n: Notice) => {
    try {
      const res = await adminUpdateNotice(n.id, { active: !n.active });
      setNotices((prev) => prev.map((x) => (x.id === n.id ? res.notice : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const onDelete = async (n: Notice) => {
    if (!confirm(`Delete notice "${n.title || n.message.slice(0, 40)}"?`)) return;
    try {
      await adminDeleteNotice(n.id);
      setNotices((prev) => prev.filter((x) => x.id !== n.id));
      toast.success("Notice deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <section className="mt-10 rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div className="inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-[15px] font-semibold text-foreground">
              Global Notices
            </h2>
            <p className="text-[11.5px] text-muted-foreground">
              Announcements shown across the app — instantly editable.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "Cancel" : "New notice"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-border"
          >
            <NoticeForm onCreated={onCreated} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-muted-foreground">
            No notices yet. Create one to broadcast across the app.
          </div>
        ) : (
          notices.map((n) => (
            <NoticeRow
              key={n.id}
              notice={n}
              onToggle={() => void onToggle(n)}
              onDelete={() => void onDelete(n)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function NoticeRow({
  notice,
  onToggle,
  onDelete,
}: {
  notice: Notice;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const TypeIcon =
    TYPES.find((t) => t.value === notice.type)?.Icon ?? Info;
  const expired =
    notice.expiresAt && new Date(notice.expiresAt).getTime() <= Date.now();
  return (
    <div className="flex items-start gap-3 px-6 py-4">
      <span
        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${TYPE_COLOR[notice.type]}`}
      >
        <TypeIcon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {notice.title && (
            <span className="text-[13px] font-semibold text-foreground">
              {notice.title}
            </span>
          )}
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_COLOR[notice.type]}`}
          >
            {notice.type}
          </span>
          {expired && (
            <span className="rounded-full border border-border bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Expired
            </span>
          )}
        </div>
        <p className="mt-1 text-[12.5px] text-foreground/85">{notice.message}</p>
        <p className="mt-1 text-[10.5px] text-muted-foreground">
          {notice.expiresAt
            ? `Expires ${new Date(notice.expiresAt).toLocaleString()}`
            : "No expiry"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onToggle}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
            notice.active
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
              : "border-border bg-white/[0.03] text-muted-foreground hover:text-foreground"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              notice.active ? "bg-emerald-400" : "bg-muted-foreground/60"
            }`}
          />
          {notice.active ? "Active" : "Disabled"}
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete notice"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function NoticeForm({ onCreated }: { onCreated: (n: Notice) => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NoticeType>("info");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await adminCreateNotice({
        title: title.trim(),
        message: message.trim(),
        type,
        active: true,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      onCreated(res.notice);
      setTitle("");
      setMessage("");
      setType("info");
      setExpiresAt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 px-6 py-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Title (optional)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Scheduled maintenance"
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Type
          </label>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {TYPES.map((t) => {
              const Icon = t.Icon;
              const active = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-2 text-[11px] font-semibold transition ${
                    active
                      ? TYPE_COLOR[t.value]
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div>
        <label className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="What do you want to announce?"
          className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-[10.5px] text-muted-foreground">
          {message.length}/500
        </p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Expires (optional)
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-2 rounded-md border border-border bg-background px-3 py-2 text-[12.5px] text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[12.5px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Publish notice
        </button>
      </div>
    </form>
  );
}

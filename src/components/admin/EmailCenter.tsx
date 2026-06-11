import { useMemo, useState } from "react";
import { Loader2, Mail, Megaphone, Send, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { adminSendEmail, fetchAdminAllUserEmails } from "@/lib/api";

const SEND_DELAY_MS = 500;

type Mode = "single" | "broadcast";

type SendStatus = {
  total: number;
  sent: number;
  failed: number;
  current: string | null;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function buildHtml(message: string) {
  // Wrap plain text message into a clean HTML template for better deliverability.
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e6e8eb;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px 32px;">
          <div style="font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#16a34a;">SymDeals</div>
        </td></tr>
        <tr><td style="padding:8px 32px 32px 32px;font-size:15px;line-height:1.6;color:#1a1a1a;">
          ${safe}
        </td></tr>
        <tr><td style="padding:18px 32px;background:#fafbfc;border-top:1px solid #eef0f2;font-size:11px;color:#7a7f87;">
          You're receiving this email because you have a SymDeals account.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendOne(payload: { to: string; subject: string; html: string }) {
  // Routed through our backend (admin-only) which proxies to the external
  // email API. This avoids the browser CORS block on the upstream service.
  await adminSendEmail(payload);
}

export function EmailCenter() {
  const [mode, setMode] = useState<Mode>("single");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<SendStatus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const charCount = message.length;
  const subjectCount = subject.length;

  const canSendSingle = useMemo(
    () => isValidEmail(to) && subject.trim().length > 0 && message.trim().length > 0,
    [to, subject, message]
  );
  const canSendBroadcast = useMemo(
    () => subject.trim().length > 0 && message.trim().length > 0,
    [subject, message]
  );

  const onSendSingle = async () => {
    if (!canSendSingle || sending) return;
    setSending(true);
    try {
      await sendOne({ to: to.trim(), subject: subject.trim(), html: buildHtml(message) });
      toast.success(`Email sent to ${to.trim()}`);
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const onSendTestToMe = async () => {
    const target = window.prompt("Send test email to which address?", to.trim());
    if (!target) return;
    if (!isValidEmail(target)) {
      toast.error("Invalid email");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setSending(true);
    try {
      await sendOne({
        to: target.trim(),
        subject: `[TEST] ${subject.trim()}`,
        html: buildHtml(message),
      });
      toast.success(`Test sent to ${target.trim()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setSending(false);
    }
  };

  const runBroadcast = async () => {
    setConfirmOpen(false);
    if (!canSendBroadcast || sending) return;
    setSending(true);
    setProgress({ total: 0, sent: 0, failed: 0, current: null });
    try {
      const list = await fetchAdminAllUserEmails();
      const recipients = list.users.filter((u) => isValidEmail(u.email));
      if (recipients.length === 0) {
        toast.error("No registered users found");
        setProgress(null);
        return;
      }
      setProgress({ total: recipients.length, sent: 0, failed: 0, current: null });

      const html = buildHtml(message);
      const subj = subject.trim();
      let sent = 0;
      let failed = 0;

      for (const r of recipients) {
        setProgress({
          total: recipients.length,
          sent,
          failed,
          current: r.email,
        });
        try {
          await sendOne({ to: r.email, subject: subj, html });
          sent += 1;
        } catch {
          failed += 1;
        }
        // Throttle to avoid Gmail rate-limits.
        await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
      }

      setProgress({ total: recipients.length, sent, failed, current: null });
      if (failed === 0) {
        toast.success(`Broadcast complete — ${sent} emails sent`);
      } else {
        toast.warning(`Broadcast complete — ${sent} sent, ${failed} failed`);
      }
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed");
      setProgress(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
          <Mail className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-display text-[15px] font-bold tracking-tight text-foreground">
          Email Center
        </h2>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-surface p-6">
        {/* Mode toggle */}
        <div className="inline-flex rounded-md border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setMode("single")}
            disabled={sending}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              mode === "single"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            Send to Single User
          </button>
          <button
            type="button"
            onClick={() => setMode("broadcast")}
            disabled={sending}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              mode === "broadcast"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Megaphone className="h-3.5 w-3.5" />
            Broadcast to All Users
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {mode === "single" && (
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Receiver Email
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={sending}
                placeholder="user@example.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Subject
              </label>
              <span className="text-[10.5px] text-muted-foreground/70">
                {subjectCount}/180
              </span>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 180))}
              disabled={sending}
              placeholder="Your subject line"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Message
              </label>
              <span className="text-[10.5px] text-muted-foreground/70">
                {charCount} chars
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              rows={8}
              placeholder="Write your message here. Plain text — we'll wrap it in a clean HTML template for better delivery."
              className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {mode === "broadcast" && (
            <p className="rounded-md border border-border bg-background px-3 py-2 text-[12px] text-muted-foreground">
              All registered users will receive this email.
            </p>
          )}

          {progress && (
            <div className="rounded-md border border-border bg-background px-3 py-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-foreground">
                  {progress.sent + progress.failed}/{progress.total} processed
                </span>
                <span className="text-muted-foreground">
                  {progress.sent} sent · {progress.failed} failed
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${
                      progress.total
                        ? Math.round(((progress.sent + progress.failed) / progress.total) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              {progress.current && (
                <p className="mt-2 truncate text-[11px] text-muted-foreground">
                  Sending to {progress.current}…
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {mode === "single" ? (
              <button
                type="button"
                onClick={onSendSingle}
                disabled={!canSendSingle || sending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[12.5px] font-semibold text-primary-foreground transition-all hover:bg-[var(--primary-hover)] hover:shadow-glow disabled:opacity-50 disabled:hover:shadow-none"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send Email
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={!canSendBroadcast || sending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[12.5px] font-semibold text-primary-foreground transition-all hover:bg-[var(--primary-hover)] hover:shadow-glow disabled:opacity-50 disabled:hover:shadow-none"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Megaphone className="h-3.5 w-3.5" />
                )}
                Send Broadcast
              </button>
            )}

            <button
              type="button"
              onClick={onSendTestToMe}
              disabled={sending || !subject.trim() || !message.trim()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-muted-foreground/30 hover:bg-surface-elevated disabled:opacity-50"
            >
              Send test email
            </button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <h3 className="mt-3 font-display text-[16px] font-bold tracking-tight text-foreground">
              Send broadcast email?
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              This will send the email to <strong className="text-foreground">all registered users</strong>.
              Sends are throttled by ~{SEND_DELAY_MS}ms each to protect deliverability.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-border bg-background px-3.5 py-2 text-[12.5px] font-semibold text-foreground transition-colors hover:bg-surface-elevated"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runBroadcast}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-primary-foreground transition-all hover:bg-[var(--primary-hover)] hover:shadow-glow"
              >
                <Send className="h-3.5 w-3.5" />
                Yes, send to all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

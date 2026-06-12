const { upstreamFetch } = require("./upstreamFetch");

const EMAIL_API_URL =
  process.env.EMAIL_API_URL || "http://13.236.80.206:4000/sendemail";
const FROM_ADDRESS =
  process.env.EMAIL_FROM || "SymDeals Team <noreply@symdeals.com>";

function shell({ title, badge, heading, body, accent = "#7DD3FC" }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${title}</title></head>
<body style="margin:0;padding:32px 16px;background:#0A0C10;font-family:Inter,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#EFF3FC;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#111827;border-radius:24px;overflow:hidden;box-shadow:0 20px 35px -12px rgba(0,0,0,.5),0 0 0 1px #2D3A5E;">
    <div style="padding:36px 32px 40px;text-align:center;">
      <div style="font-size:24px;font-weight:700;letter-spacing:-0.3px;background:linear-gradient(135deg,#F0F3FA 20%,#A3C6FF 90%);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:20px;">SymDeals</div>
      <div style="display:inline-block;background:${accent}1F;border:0.5px solid ${accent}55;color:${accent};border-radius:40px;padding:4px 14px;font-size:11px;font-weight:600;letter-spacing:0.3px;margin-bottom:18px;">${badge}</div>
      <h2 style="font-size:24px;font-weight:700;margin:8px 0 12px;color:#fff;letter-spacing:-0.2px;">${heading}</h2>
      <div style="font-size:15px;color:#CBD5E1;margin-bottom:24px;">${body}</div>
      <div style="font-size:11px;color:#64748B;margin-top:24px;border-top:1px solid #1F2A44;padding-top:18px;">If you didn't request this, please contact SymDeals support immediately.</div>
    </div>
  </div>
</body></html>`;
}

async function send({ to, subject, html }) {
  const res = await upstreamFetch(EMAIL_API_URL, {
    method: "POST",
    body: { from: FROM_ADDRESS, to, subject, html },
  });
  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch { /* ignore */ }
    throw new Error(`Email API ${res.status}: ${body.slice(0, 200)}`);
  }
  return true;
}

async function sendDeletionRequestedEmail({ to, name }) {
  return send({
    to,
    subject: "SymDeals — Account deletion in progress",
    html: shell({
      title: "Account deletion in progress",
      badge: "ACCOUNT DELETION",
      heading: "We're processing your request",
      accent: "#FBBF24",
      body: `Hi ${name || "there"},<br/><br/>We received a request to permanently delete your SymDeals account. Your account data is being removed now. You'll receive a final confirmation shortly.`,
    }),
  });
}

async function sendDeletionConfirmedEmail({ to, name }) {
  return send({
    to,
    subject: "SymDeals — Your account has been deleted",
    html: shell({
      title: "Account deleted",
      badge: "DELETION COMPLETE",
      heading: "Your account has been deleted",
      accent: "#F87171",
      body: `Hi ${name || "there"},<br/><br/>Your SymDeals account and personal data have been permanently deleted. Completed order records may be retained in anonymized form for legal and accounting purposes.<br/><br/>We're sorry to see you go. You're welcome back any time.`,
    }),
  });
}

module.exports = { sendDeletionRequestedEmail, sendDeletionConfirmedEmail };

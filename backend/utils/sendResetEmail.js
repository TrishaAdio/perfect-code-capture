const { upstreamFetch } = require("./upstreamFetch");

const EMAIL_API_URL =
  process.env.EMAIL_API_URL || "http://13.236.80.206:4000/sendemail";

const FROM_ADDRESS = process.env.EMAIL_FROM || "SymDeals Team <noreply@symdeals.com>";

function buildResetHtml({ link }) {
  const safeLink = String(link).replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SymDeals — Reset your password</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0A0C10;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #EFF3FC;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background: #111827;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px #3E2C3B;
    }
    .card-inner { padding: 36px 32px 40px; text-align: center; }
    .logo-area {
      display: flex; justify-content: center; align-items: center;
      gap: 8px; margin-bottom: 24px;
    }
    .logo-icon { font-size: 28px; font-weight: 500; color: #F9A8D4; }
    .logo-text {
      font-size: 26px; font-weight: 700; letter-spacing: -0.3px;
      background: linear-gradient(135deg, #F0F3FA 20%, #FBCFE8 90%);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .badge-reset {
      background: rgba(244, 114, 182, 0.12);
      border-radius: 40px; padding: 4px 14px;
      font-size: 11px; font-weight: 600; color: #F9A8D4;
      display: inline-block; margin-bottom: 18px;
      letter-spacing: 0.3px; border: 0.5px solid rgba(244, 114, 182, 0.3);
    }
    h2 {
      font-size: 28px; font-weight: 700;
      margin-top: 8px; margin-bottom: 12px;
      letter-spacing: -0.2px; color: #FFFFFF;
    }
    .description {
      font-size: 16px; color: #CBD5E1; margin-bottom: 8px;
      max-width: 400px; margin-left: auto; margin-right: auto;
    }
    .btn-reset {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 12px;
      background: linear-gradient(105deg, #F472B6 0%, #BE185D 100%);
      color: #FFFFFF !important; text-decoration: none;
      font-weight: 700; font-size: 18px;
      padding: 14px 32px; border-radius: 60px;
      margin: 24px 0 18px;
      box-shadow: 0 12px 20px -10px rgba(244, 114, 182, 0.35);
      border: none; letter-spacing: 0.2px;
    }
    .info-grid {
      display: flex; justify-content: center; gap: 10px;
      margin: 18px 0 12px; flex-wrap: wrap;
    }
    .info-chip {
      background: #1E293B; border-radius: 60px;
      padding: 6px 14px; font-size: 12px; font-weight: 500;
      color: #CBD5E1; display: inline-flex; align-items: center; gap: 8px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #3E2C3B, transparent);
      margin: 26px 0 16px;
    }
    .footer-note {
      font-size: 12px; color: #7E8AA8; text-align: center;
      line-height: 1.5; margin-top: 10px;
    }
    .reset-link-fallback {
      font-size: 11px; word-break: break-all;
      background: #1E1A2F; padding: 10px 14px;
      display: inline-block; border-radius: 12px;
      margin-top: 10px; color: #E2E8F0;
      font-family: monospace; max-width: 100%;
    }
    .security-seal {
      display: flex; justify-content: center; gap: 14px;
      align-items: center; margin-top: 24px;
      font-size: 11px; color: #5B6E8C;
    }
    @media (max-width: 500px) {
      .card-inner { padding: 28px 20px 34px; }
      h2 { font-size: 24px; }
      .btn-reset { font-size: 16px; padding: 12px 28px; }
      .logo-text { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-inner">
      <div class="logo-area">
        <span class="logo-icon">◈</span>
        <span class="logo-text">SymDeals</span>
      </div>

      <div class="badge-reset">PASSWORD RESET</div>

      <h2>Reset your password</h2>
      <p class="description">
        We received a request to reset your password. Click the secure button below to create a new one.
      </p>

      <a href="${safeLink}" class="btn-reset">⟳ Reset password</a>

      <div class="info-grid">
        <span class="info-chip">⏱ Link expires in 10 minutes</span>
        <span class="info-chip">📱 Works on any device</span>
        <span class="info-chip">🔑 Advanced encryption</span>
      </div>

      <p class="footer-note">
        If the button does not work, copy and paste this link into your browser:
      </p>
      <div class="reset-link-fallback">${safeLink}</div>

      <div class="divider"></div>

      <p class="footer-note">
        If you did not request this, you can safely ignore this email.<br/>
        No changes will be made to your account.
      </p>

      <div class="security-seal">
        <span>identity verification</span>
        <span>•</span>
        <span>time-sensitive</span>
        <span>•</span>
        <span>SymDeals security</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendResetEmail({ to, name, link }) {
  const res = await upstreamFetch(EMAIL_API_URL, {
    method: "POST",
    body: {
      from: FROM_ADDRESS,
      to,
      subject: "Reset your SymDeals password",
      html: buildResetHtml({ name, link }),
    },
  });
  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`Email API ${res.status}: ${body.slice(0, 200)}`);
  }
  return true;
}

module.exports = { sendResetEmail };

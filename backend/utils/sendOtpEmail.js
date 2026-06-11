const { upstreamFetch } = require("./upstreamFetch");

const EMAIL_API_URL =
  process.env.EMAIL_API_URL || "http://13.236.80.206:4000/sendemail";

const FROM_ADDRESS = process.env.EMAIL_FROM || "SymDeals Team <noreply@symdeals.com>";

function buildOtpHtml({ code }) {
  const safeCode = String(code).replace(/[<>]/g, "");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SymDeals — Verify your email</title>
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
      box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px #2D3A5E;
    }
    .card-inner { padding: 36px 32px 40px; text-align: center; }
    .logo-area {
      display: flex; justify-content: center; align-items: center;
      gap: 8px; margin-bottom: 24px;
    }
    .logo-icon { font-size: 28px; font-weight: 500; color: #7DD3FC; }
    .logo-text {
      font-size: 26px; font-weight: 700; letter-spacing: -0.3px;
      background: linear-gradient(135deg, #F0F3FA 20%, #A3C6FF 90%);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .badge-otp {
      background: rgba(56, 189, 248, 0.12);
      border-radius: 40px; padding: 4px 14px;
      font-size: 11px; font-weight: 600; color: #7DD3FC;
      display: inline-block; margin-bottom: 18px;
      letter-spacing: 0.3px; border: 0.5px solid rgba(56, 189, 248, 0.3);
    }
    h2 {
      font-size: 28px; font-weight: 700;
      margin-top: 8px; margin-bottom: 12px;
      letter-spacing: -0.2px; color: #FFFFFF;
    }
    .description {
      font-size: 16px; color: #CBD5E1; margin-bottom: 28px;
      max-width: 380px; margin-left: auto; margin-right: auto;
    }
    .otp-card {
      background: #0B111E; border-radius: 24px;
      padding: 22px 20px; margin: 16px 0 20px;
      border: 1px solid #1F2A44;
      box-shadow: 0 6px 14px -6px rgba(0, 0, 0, 0.4);
    }
    .otp-code {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 44px; letter-spacing: 12px; font-weight: 800;
      background: linear-gradient(120deg, #93E9FF, #38BDF8);
      -webkit-background-clip: text; background-clip: text; color: transparent;
      word-break: break-word;
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
      background: linear-gradient(90deg, transparent, #2D3A5E, transparent);
      margin: 26px 0 16px;
    }
    .footer-note {
      font-size: 12px; color: #7E8AA8; text-align: center;
      line-height: 1.5; margin-top: 10px;
    }
    .security-seal {
      display: flex; justify-content: center; gap: 14px;
      align-items: center; margin-top: 24px;
      font-size: 11px; color: #5B6E8C;
    }
    @media (max-width: 500px) {
      .card-inner { padding: 28px 20px 34px; }
      .otp-code { font-size: 34px; letter-spacing: 8px; }
      h2 { font-size: 24px; }
      .logo-text { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-inner">
      <div class="logo-area">
        <span class="logo-icon">◆</span>
        <span class="logo-text">SymDeals</span>
      </div>

      <div class="badge-otp">SECURE SIGN-IN</div>

      <h2>Verify your email</h2>
      <p class="description">Use the secure code below to continue to your account.</p>

      <div class="otp-card">
        <div class="otp-code">${safeCode}</div>
      </div>

      <div class="info-grid">
        <span class="info-chip">⏱ 10 minutes validity</span>
        <span class="info-chip">⟳ One-time use</span>
        <span class="info-chip">🔒 Encrypted delivery</span>
      </div>

      <p class="footer-note">For your security, never share this code with anyone.</p>

      <div class="divider"></div>

      <p class="footer-note">
        Did not request this code? You can safely ignore this email.<br/>
        Your account remains protected.
      </p>

      <div class="security-seal">
        <span>secure channel</span>
        <span>•</span>
        <span>SymDeals trust</span>
        <span>•</span>
        <span>global edge</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendOtpEmail({ to, name, code }) {
  const res = await upstreamFetch(EMAIL_API_URL, {
    method: "POST",
    body: {
      from: FROM_ADDRESS,
      to,
      subject: "Your SymDeals verification code",
      html: buildOtpHtml({ name, code }),
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

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = { sendOtpEmail, generateOtp };

import nodemailer from 'nodemailer';

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  // Always log OTP to console as backup
  console.log(`\n📧 OTP for ${email}: ${otp}\n`);

  // Try sending real email
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass || smtpUser === 'your@gmail.com') {
    console.log('⚠️  SMTP not configured — using console-only OTP');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"SoulBound" <${smtpUser}>`,
      to: email,
      subject: 'Your OTP — SoulBound',
      html: `
        <div style="font-family:'Montserrat',sans-serif;max-width:440px;margin:auto;padding:40px;background:#0e0e0e;color:#ece6da;border-radius:16px;border:1px solid rgba(212,175,55,0.2)">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:36px">💍</span>
          </div>
          <h2 style="color:#D4AF37;text-align:center;font-size:28px;margin:0 0 8px;letter-spacing:2px">SoulBound</h2>
          <p style="text-align:center;color:#7a6f60;font-size:14px;margin:0 0 32px">Your verification code</p>
          <div style="background:#1c1c1c;border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <h1 style="letter-spacing:12px;color:#D4AF37;font-size:36px;margin:0">${otp}</h1>
          </div>
          <p style="color:#7a6f60;font-size:13px;text-align:center;margin:0">Valid for 10 minutes. Do not share this with anyone.</p>
          <hr style="border:none;border-top:1px solid rgba(212,175,55,0.15);margin:24px 0 16px" />
          <p style="color:#4a4030;font-size:11px;text-align:center;margin:0">© 2026 SoulBound · Verified Connections</p>
        </div>
      `,
    });
    console.log(`✅ OTP email sent to ${email}`);
  } catch (err: any) {
    console.error(`❌ Failed to send email:`, err.message);
    console.log(`📧 Fallback — OTP for ${email}: ${otp}`);
  }
}

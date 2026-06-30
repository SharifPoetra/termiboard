import nodemailer from 'nodemailer';
import { FastifyInstance } from 'fastify';

export const sendOtpEmail = async (to: string, username: string, otp: string, config: FastifyInstance['config']) => {
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: true,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: config.SMTP_FROM,
    to,
    subject: '[TermiBoard] Securing Channel - Action Required: Verify OTP',
    text: `Hello ${username},\n\nYour dynamic terminal access security code is: ${otp}\n\nThis code will expire in 5 minutes.\nIf you did not initiate this command, please ignore this log.`,
    html: `
      <div style="background-color: #020617; color: #f8fafc; font-family: monospace; padding: 24px; border: 1px solid #1e293b; border-radius: 4px;">
        <h2 style="color: #10b981; margin-bottom: 16px; font-size: 16px; border-bottom: 1px solid #334155; padding-bottom: 8px;">// SECURITY IDENTITY VERIFICATION</h2>
        <p style="font-size: 13px; color: #94a3b8;">&gt; Initiating registration sequence for user: <span style="color: #f1f5f9; font-bold">${username}</span></p>
        <p style="font-size: 13px; color: #94a3b8;">&gt; Your dynamic OTP configuration key is:</p>
        <div style="background-color: #090d16; border: 1px solid #059669; padding: 12px; text-align: center; font-size: 24px; font-weight: bold; color: #10b981; tracking-content: 4px; margin: 20px 0; border-radius: 4px;">
          ${otp}
        </div>
        <p style="font-size: 11px; color: #64748b;">&gt; SYSTEM NOTE: This matrix parameter expires in T-minus 5 minutes. Do not share this signal link.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

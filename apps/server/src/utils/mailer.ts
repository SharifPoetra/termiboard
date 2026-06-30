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
    subject: '[TermiBoard] Verify your email address',
    text: `Hello ${username},\n\nThank you for registering with TermiBoard. Please use the following One-Time Password (OTP) to verify your account:\n\n${otp}\n\nThis code will expire in 5 minutes. If you did not request this, please ignore this email.`,
    html: `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; bg-color: #ffffff; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
          
          <div style="margin-bottom: 24px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -0.025em;">TermiBoard</h1>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 0 0 24px 0;" />
          
          <p style="font-size: 15px; line-height: 24px; color: #334155; margin: 0 0 16px 0;">
            Hello <strong>${username}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 24px; color: #334155; margin: 0 0 24px 0;">
            Thank you for creating an account on TermiBoard. Please use the verification code below to complete your registration sequence:
          </p>
          
          <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 6px; padding-left: 6px;">${otp}</span>
          </div>
          
          <p style="font-size: 13px; line-height: 20px; color: #64748b; margin: 0 0 24px 0;">
            This verification code is valid for <strong>5 minutes</strong>. For security reasons, do not share this code with anyone.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 0 0 16px 0;" />
          
          <p style="font-size: 12px; line-height: 18px; color: #94a3b8; margin: 0;">
            If you did not initiate this request, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

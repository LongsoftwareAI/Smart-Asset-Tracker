import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NODE_ENV } = process.env;
  if (!SMTP_HOST) {
    if (NODE_ENV !== 'production') {
      console.info(`Password reset URL for ${email}: ${resetUrl}`);
    }
    return;
  }

  if (!SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error('SMTP_USER, SMTP_PASS and SMTP_FROM must be configured with SMTP_HOST.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'Đặt lại mật khẩu AssetMate',
    text: `Mở liên kết này để đặt lại mật khẩu trong 15 phút: ${resetUrl}`,
  });
}

import nodemailer from 'nodemailer';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Dev fallback: log to console
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendResetEmail(to: string, token: string, username: string): Promise<void> {
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const link = `${frontendUrl}/reset-senha?token=${token}`;

  const transporter = getTransporter();

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #6366f1;">Fluxo — Redefinição de Senha</h2>
      <p>Olá, <strong>${username}</strong>!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <a href="${link}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
        Redefinir Senha
      </a>
      <p style="color: #6b7280; font-size: 12px;">Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.</p>
      <p style="color: #6b7280; font-size: 12px;">Ou copie este link: ${link}</p>
    </div>
  `;

  if (!transporter) {
    console.log(`[DEV] Reset link para ${to}: ${link}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Fluxo — Redefinição de Senha',
    html,
  });
}

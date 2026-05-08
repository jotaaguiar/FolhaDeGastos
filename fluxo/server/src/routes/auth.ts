import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from '../services/db.js';
import { signToken, hashPassword, verifyToken } from '../middleware/auth.js';
import { sendResetEmail } from '../services/mailer.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    return;
  }
  const user = await prisma.user.findFirst({
    where: { username: { equals: username } },
  });
  if (!user) { res.status(401).json({ error: 'Usuário ou senha incorretos' }); return; }
  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) { res.status(401).json({ error: 'Usuário ou senha incorretos' }); return; }
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, username: user.username } });
});

router.post('/register', async (req: Request, res: Response) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    return;
  }
  if (password.length < 4) {
    res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
    return;
  }
  const existing = await prisma.user.findFirst({
    where: { username: { equals: username } },
  });
  if (existing) {
    res.status(409).json({ error: 'Nome de usuário já existe' });
    return;
  }
  const salt = uuid();
  const newUser = await prisma.user.create({
    data: {
      id: uuid(),
      username,
      email: email || null,
      passwordHash: hashPassword(password, salt),
      salt,
      criadoEm: new Date().toISOString(),
    },
  });
  const token = signToken(newUser.id);
  res.status(201).json({ token, user: { id: newUser.id, username: newUser.username } });
});

// PUT /auth/me/email — update email for current user
router.put('/me/email', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Não autenticado' }); return; }
  const tokenData = verifyToken(header.slice(7));
  if (!tokenData) { res.status(401).json({ error: 'Token inválido' }); return; }
  const { email } = req.body;
  await prisma.user.update({ where: { id: tokenData.userId }, data: { email } });
  res.json({ ok: true });
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: 'E-mail é obrigatório' }); return; }
  const user = await prisma.user.findFirst({ where: { email } });
  // Always return 200 to avoid email enumeration
  if (!user) { res.json({ ok: true }); return; }

  const token = uuid();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { id: uuid(), userId: user.id, token, expiresAt, used: false },
  });

  try {
    await sendResetEmail(email, token, user.username);
  } catch (e) {
    console.error('Erro ao enviar e-mail:', e);
  }

  res.json({ ok: true });
});

// POST /auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) { res.status(400).json({ error: 'Token e senha são obrigatórios' }); return; }
  if (password.length < 4) { res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' }); return; }

  const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!reset || reset.used || new Date(reset.expiresAt) < new Date()) {
    res.status(400).json({ error: 'Token inválido ou expirado' }); return;
  }

  const salt = uuid();
  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash: hashPassword(password, salt), salt },
  });
  await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });

  res.json({ ok: true });
});

router.get('/me', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Não autenticado' }); return; }
  const token = header.slice(7);
  const data = verifyToken(token);
  if (!data) { res.status(401).json({ error: 'Token inválido' }); return; }
  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }
  res.json({ id: user.id, username: user.username, email: user.email });
});

export default router;

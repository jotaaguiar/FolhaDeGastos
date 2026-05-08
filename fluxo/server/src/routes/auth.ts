import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from '../services/db.js';
import { signToken, hashPassword, verifyToken } from '../middleware/auth.js';
import { seedIfEmpty } from '../services/seed.js';

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
  const { username, password } = req.body;
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
      passwordHash: hashPassword(password, salt),
      salt,
      criadoEm: new Date().toISOString(),
    },
  });
  await seedIfEmpty(newUser.id);
  const token = signToken(newUser.id);
  res.status(201).json({ token, user: { id: newUser.id, username: newUser.username } });
});

router.get('/me', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Não autenticado' }); return; }
  const token = header.slice(7);
  const data = verifyToken(token);
  if (!data) { res.status(401).json({ error: 'Token inválido' }); return; }
  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }
  res.json({ id: user.id, username: user.username });
});

export default router;

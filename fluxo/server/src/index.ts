import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { prisma } from './services/db.js';
import { seedIfEmpty } from './services/seed.js';
import { hashPassword } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';
import contasRouter from './routes/contas.js';
import cartoesRouter from './routes/cartoes.js';
import transacoesRouter from './routes/transacoes.js';
import faturasRouter from './routes/faturas.js';
import recorrenciasRouter from './routes/recorrencias.js';
import orcamentoRouter from './routes/orcamento.js';
import metasRouter from './routes/metas.js';
import dashboardRouter from './routes/dashboard.js';
import configRouter from './routes/config.js';
import categoriasRouter from './routes/categorias.js';
import importacaoRouter from './routes/importacao.js';
import comparativoRouter from './routes/comparativo.js';
import relatoriosRouter from './routes/relatorios.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Support multiple origins (comma-separated in env)
const corsOrigins = CORS_ORIGIN.split(',').map(o => o.trim());

app.use(cors({
  origin: corsOrigins.length > 1 ? corsOrigins : corsOrigins[0],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ name: 'Fluxo API', version: '1.0.0', status: 'online' });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, version: '1.0.0' });
});
app.use('/api/auth', authRouter);

app.use('/api/contas', authMiddleware, contasRouter);
app.use('/api/cartoes', authMiddleware, cartoesRouter);
app.use('/api/transacoes', authMiddleware, transacoesRouter);
app.use('/api/faturas', authMiddleware, faturasRouter);
app.use('/api/recorrencias', authMiddleware, recorrenciasRouter);
app.use('/api/orcamento', authMiddleware, orcamentoRouter);
app.use('/api/metas', authMiddleware, metasRouter);
app.use('/api/dashboard', authMiddleware, dashboardRouter);
app.use('/api/config', authMiddleware, configRouter);
app.use('/api/categorias', authMiddleware, categoriasRouter);
app.use('/api/importacao', authMiddleware, importacaoRouter);
app.use('/api/comparativo', authMiddleware, comparativoRouter);
app.use('/api/relatorios', authMiddleware, relatoriosRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada` });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Erro interno do servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

async function bootstrap() {
  // Ensure JoaoAguiar user exists
  const existing = await prisma.user.findUnique({ where: { id: 'joao-aguiar' } });
  if (!existing) {
    const salt = 'joao-aguiar-salt';
    await prisma.user.create({
      data: {
        id: 'joao-aguiar',
        username: 'JoaoAguiar',
        passwordHash: hashPassword('1234', salt),
        salt,
        criadoEm: new Date().toISOString(),
      },
    });
    console.log('👤 Usuário JoaoAguiar criado');
  }

  await seedIfEmpty('joao-aguiar');

  // Cold-start: materializa recorrências antigas (idempotente, respeita pulosManual)
  try {
    const { readFile, writeFile } = await import('./services/storage.js');
    const { materializarRecorrencia } = await import('./routes/recorrencias.js');
    const userId = 'joao-aguiar';
    const recorrencias = await readFile<import('./types/index.js').RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
    const transacoes = await readFile<import('./types/index.js').Transacao[]>(userId, 'transacoes.json', []);
    const faturas = await readFile<import('./types/index.js').Fatura[]>(userId, 'faturas.json', []);
    const cartoes = await readFile<import('./types/index.js').Cartao[]>(userId, 'cartoes.json', []);

    let criadas = 0;
    for (const rec of recorrencias) {
      criadas += materializarRecorrencia(rec, transacoes, faturas, cartoes);
    }

    if (criadas > 0) {
      await writeFile(userId, 'transacoes.json', transacoes);
      await writeFile(userId, 'faturas.json', faturas);
      console.log(`🔄 ${criadas} transações recorrentes materializadas`);
    }
  } catch (e) {
    console.log('⚠ Erro ao processar recorrências:', e);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Fluxo API rodando na porta ${PORT}`);
  });
}

bootstrap();

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

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

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

  // Auto-process recurring for current month
  try {
    const { readFile, writeFile } = await import('./services/storage.js');
    const { v4: uuid } = await import('uuid');
    const userId = 'joao-aguiar';
    const recorrencias = await readFile<import('./types/index.js').RecorrenciaConfig[]>(userId, 'recorrencias.json', []);
    const transacoes = await readFile<import('./types/index.js').Transacao[]>(userId, 'transacoes.json', []);
    const faturas = await readFile<import('./types/index.js').Fatura[]>(userId, 'faturas.json', []);
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    let criadas = 0;

    for (const rec of recorrencias) {
      if (!rec.ativa) continue;
      if (rec.fimEm && new Date(rec.fimEm) < new Date(anoAtual, mesAtual - 1, 1)) continue;
      const jaExiste = transacoes.find(t => {
        if (t.recorrenciaId !== rec.id) return false;
        const d = new Date(t.data);
        return d.getMonth() + 1 === mesAtual && d.getFullYear() === anoAtual;
      });
      if (jaExiste) continue;

      const dia = Math.min(rec.diaCobranca, new Date(anoAtual, mesAtual, 0).getDate());
      const data = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      let faturaId: string | undefined;
      if (rec.tipo === 'credito_cartao' && rec.cartaoId) {
        const fat = faturas.find(f => f.cartaoId === rec.cartaoId && f.mes === mesAtual && f.ano === anoAtual);
        if (fat) faturaId = fat.id;
      }
      transacoes.push({
        id: uuid(),
        descricao: rec.descricao,
        valor: rec.valor,
        tipo: rec.tipo,
        data,
        categoria: rec.categoria,
        contaId: rec.contaId,
        cartaoId: rec.cartaoId,
        faturaId,
        recorrente: true,
        recorrenciaId: rec.id,
        criadoEm: new Date().toISOString(),
      });
      criadas++;
    }

    if (criadas > 0) {
      await writeFile(userId, 'transacoes.json', transacoes);
      console.log(`🔄 ${criadas} transações recorrentes processadas`);
    }
  } catch (e) {
    console.log('⚠ Erro ao processar recorrências:', e);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Fluxo API rodando na porta ${PORT}`);
  });
}

bootstrap();

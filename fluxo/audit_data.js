import { readFile } from './server/src/services/storage.js';

async function audit() {
  const userId = 'user-default'; // Or the current user if known
  const transacoes = await readFile(userId, 'transacoes.json', []);
  const faturas = await readFile(userId, 'faturas.json', []);
  const cartoes = await readFile(userId, 'cartoes.json', []);

  console.log('--- CARTOES ---');
  cartoes.forEach(c => console.log(`${c.nome} (${c.id}) - Limite: ${c.limite}`));

  console.log('--- TRANSACOES ---');
  transacoes.forEach(t => {
    if (t.cartaoId) console.log(`Card: ${t.cartaoId}, Val: ${t.valor}, Tipo: ${t.tipo}, Data: ${t.data}`);
  });

  console.log('--- FATURAS ---');
  faturas.forEach(f => {
    if (f.valorAjuste || f.saldoAnteriorRollover) 
      console.log(`Card: ${f.cartaoId}, Mes: ${f.mes}, Ajuste: ${f.valorAjuste}, Roll: ${f.saldoAnteriorRollover}`);
  });
}

audit();

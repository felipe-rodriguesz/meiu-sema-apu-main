require('dotenv/config');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { databaseOptions } = require('../dist/config/environment');

async function main() {
  const name = (process.env.ADMIN_NAME || '').trim();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || Buffer.byteLength(password) > 72) {
    throw new Error('Informe ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 12 caracteres e máximo 72 bytes).');
  }
  const options = databaseOptions(process.env);
  const client = new Client({ connectionString: options.url, ssl: options.ssl });
  await client.connect();
  try {
    const result = await client.query(
      'INSERT INTO admin_sema (nome,email,senha_hash) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING RETURNING id',
      [name, email, await bcrypt.hash(password, 12)]
    );
    if (!result.rowCount) throw new Error('Este e-mail já existe. Nenhuma conta ou senha foi alterada.');
    console.log('Conta administrativa criada. Guarde os acessos fora do repositório.');
  } finally { await client.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

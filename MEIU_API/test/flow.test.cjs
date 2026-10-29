const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { DataSource } = require('typeorm');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { databaseOptions, validateEnvironment } = require('../dist/config/environment');

test('configuração recusa segredo fraco e origem curinga', () => {
  const valid = { DATABASE_URL: 'postgresql://local:local@localhost/test', JWT_SECRET: randomBytes(48).toString('hex'), CORS_ORIGINS: 'http://localhost:5173' };
  assert.throws(() => validateEnvironment({ ...valid, JWT_SECRET: 'fraco' }));
  assert.throws(() => validateEnvironment({ ...valid, CORS_ORIGINS: '*' }));
  assert.throws(() => validateEnvironment({ ...valid, PORT: 'zero' }));
  assert.equal(validateEnvironment(valid).PORT, 3001);
  assert.equal(databaseOptions({ ...valid, DATABASE_SSL: 'true' }).ssl.rejectUnauthorized, true);
  assert.ok(!databaseOptions({ ...valid, DATABASE_URL: valid.DATABASE_URL + '?sslmode=no-verify', DATABASE_SSL: 'true' }).url.includes('sslmode'));
});

test('API com PostgreSQL real: migrações, segurança, recebimento e concorrência', { timeout: 120000 }, async t => {
  const baseUrl = new URL(process.env.TEST_DATABASE_URL || '');
  if (!['localhost', '127.0.0.1'].includes(baseUrl.hostname) || !baseUrl.pathname.startsWith('/meiu_faseiv_test')) {
    throw new Error('TEST_DATABASE_URL deve apontar para banco LOCAL com prefixo meiu_faseiv_test. Use uma conta exclusiva de testes com CREATEDB.');
  }
  const dbName = 'meiu_faseiv_test_run_' + Date.now();
  const freshName = dbName + '_fresh';
  const admin = new Client({ connectionString: baseUrl.toString() });
  await admin.connect();
  let db, app, fresh;
  const created = [];
  t.after(async () => {
    if (app) await app.close();
    if (db?.isInitialized) await db.destroy();
    if (fresh?.isInitialized) await fresh.destroy();
    for (const name of created) await admin.query('DROP DATABASE "' + name + '" WITH (FORCE)');
    await admin.end();
  });
  for (const name of [dbName, freshName]) {
    await admin.query('CREATE DATABASE "' + name + '"');
    created.push(name);
  }
  baseUrl.pathname = '/' + dbName;
  process.env.DATABASE_URL = baseUrl.toString();
  process.env.DATABASE_SSL = 'false';
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  process.env.CORS_ORIGINS = 'http://localhost:5173';
  const source = require('../dist/database/data-source').default;
  db = new DataSource(source.options);
  await db.initialize();
  const { InitialSchema1793232000000 } = require('../dist/database/migrations/1793232000000-initial-schema');
  const initialRunner = db.createQueryRunner();
  await new InitialSchema1793232000000().up(initialRunner);
  await initialRunner.release();
  const oldId = randomUUID();
  await db.query("INSERT INTO descarte (id, protocolo, quantidade_kg, frequencia_dias) VALUES ($1, 'TX-LEGADO', -1, 7)", [oldId]);

  await t.test('migração recusa dados inválidos sem apagar registros e preserva legado após correção', async () => {
    await assert.rejects(db.runMigrations({ transaction: 'all' }), /pesos\/frequências inválidos/);
    assert.equal((await db.query('SELECT quantidade_kg FROM descarte WHERE id=$1', [oldId]))[0].quantidade_kg, -1);
    await db.query('UPDATE descarte SET quantidade_kg=5 WHERE id=$1', [oldId]);
    assert.equal((await db.runMigrations({ transaction: 'all' })).length, 3);
    assert.equal((await db.runMigrations()).length, 0);
    const [old] = await db.query('SELECT * FROM descarte WHERE id=$1', [oldId]);
    assert.equal(Number(old.quantidade_kg), 5);
    assert.equal(old.situacao, 'PENDENTE');
    assert.equal(old.peso_recebido_kg, null);
  });

  await t.test('instalação do zero tem as mesmas migrações e colunas', async () => {
    const url = new URL(process.env.DATABASE_URL); url.pathname = '/' + freshName;
    fresh = new DataSource({ ...source.options, url: url.toString() });
    await fresh.initialize();
    assert.equal((await fresh.runMigrations()).length, 3);
    const columns = async connection => connection.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='descarte' ORDER BY ordinal_position");
    assert.deepEqual(await columns(fresh), await columns(db));
  });

  const password = randomBytes(20).toString('hex');
  const operator = randomUUID();
  const secondOperator = randomUUID();
  const hash = await bcrypt.hash(password, 10);
  await db.query("INSERT INTO admin_sema (id,nome,email,senha_hash) VALUES ($1,'Operador Teste','operador@example.test',$3), ($2,'Operador Dois','dois@example.test',$3)", [operator, secondOperator, hash]);
  const { AppModule } = require('../dist/app.module');
  const { configureApp } = require('../dist/config/configure-app');
  app = await NestFactory.create(AppModule, { logger: ['error'], abortOnError: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  const endpoint = await app.getUrl() + '/api/v1';
  let token, token2, point, pending, receipt;
  const request = async (method, path, body, auth = token, headers = {}) => {
    const response = await fetch(endpoint + path, {
      method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer ' + auth } : {}), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
  };

  await t.test('login, token inválido/expirado e usuário removido', async () => {
    assert.equal((await request('POST', '/auth/login', { email: 'operador@example.test', senha: 'errada' }, null)).status, 401);
    const logged = await request('POST', '/auth/login', { email: 'operador@example.test', senha: password }, null);
    assert.equal(logged.status, 201); token = logged.body.access_token;
    token2 = (await request('POST', '/auth/login', { email: 'dois@example.test', senha: password }, null)).body.access_token;
    assert.equal((await request('GET', '/descartes', undefined, 'invalido')).status, 401);
    const jwt = app.get(JwtService);
    const expired = jwt.sign({ sub: operator }, { expiresIn: -1 });
    assert.equal((await request('GET', '/descartes', undefined, expired)).status, 401);
    const absent = jwt.sign({ sub: randomUUID() });
    assert.equal((await request('GET', '/descartes', undefined, absent)).status, 401);
  });

  await t.test('admin protegido; formulário, pontos ativos e notícias públicos', async () => {
    for (const path of ['/descartes', '/stats/latest', '/pontos-coleta/admin', '/descartes/protocolo/TX-LEGADO']) {
      assert.equal((await request('GET', path, undefined, null)).status, 401, path);
    }
    assert.equal((await request('GET', '/pontos-coleta', undefined, null)).status, 200);
    assert.equal((await request('GET', '/noticias', undefined, null)).status, 200);
    assert.equal((await request('POST', '/pontos-coleta', { nome: 'Teste', tipo: 'Ponto Fixo' }, null)).status, 401);
    assert.equal((await request('POST', '/descartes/' + oldId + '/recebimento', { peso_recebido_kg: 1 }, null)).status, 401);
    const blocked = await request('GET', '/pontos-coleta', undefined, null, { Origin: 'https://nao-autorizado.example' });
    assert.equal(blocked.headers.get('access-control-allow-origin'), null);
    const allowed = await request('GET', '/pontos-coleta', undefined, null, { Origin: 'http://localhost:5173' });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });

  point = (await request('POST', '/pontos-coleta', { nome: 'Ponto fictício de teste', tipo: 'Ponto Fixo' })).body;
  const form = { eh_mistura: false, residuo_principal: 'Retalhos', quantidade_kg: 2.5, frequencia_dias: 7,
    material: 'Algodão', estado_material: 'Limpo', tipo_tecido: 'Plano', ponto_coleta_id: point.id };
  const create = async (changes = {}) => request('POST', '/descartes', { ...form, ...changes }, null);

  await t.test('2,5 kg e localização ausente; protocolo único e resposta compatível', async () => {
    const response = await create();
    assert.equal(response.status, 201); assert.equal(response.body.status, 'success');
    pending = (await request('GET', '/descartes/protocolo/' + response.body.protocolo)).body;
    assert.equal(pending.quantidade_kg, 2.5); assert.equal(pending.lat, null); assert.equal(pending.lon, null);
    assert.equal(pending.peso_recebido_kg, null); assert.equal(pending.situacao, 'PENDENTE');
    const more = await Promise.all(Array.from({ length: 4 }, () => create()));
    for (const result of more) {
      assert.equal(result.status, 201, JSON.stringify(result.body));
      assert.equal(typeof result.body.protocolo, 'string');
    }
    assert.equal(new Set(more.map(r => r.body.protocolo)).size, 4);
  });

  await t.test('validação rejeita peso/frequência inválidos, ponto ausente e campos administrativos', async () => {
    for (const changes of [
      { quantidade_kg: 0 }, { quantidade_kg: -1 }, { quantidade_kg: 1.2345 }, { quantidade_kg: 1000000000 },
      { quantidade_kg: '2.5' }, { frequencia_dias: 1.5 }, { frequencia_dias: 0 }, { ponto_coleta_id: null },
      { ponto_coleta_id: randomUUID() }, { lat: 1 }, { lon: 1 }, { lat: 91, lon: 1 },
      { situacao: 'RECEBIDO' }, { residuo_principal: '   ' },
    ]) assert.equal((await create(changes)).status, 400, JSON.stringify(changes));
  });

  await t.test('ponto inativo não recebe novos pedidos; exclusão vinculada retorna 409', async () => {
    assert.equal((await request('DELETE', '/pontos-coleta/' + point.id + '?tipo=hard')).status, 409);
    assert.equal((await request('DELETE', '/pontos-coleta/' + point.id + '?tipo=soft')).status, 200);
    assert.equal((await create()).status, 400);
    assert.equal((await request('GET', '/pontos-coleta', undefined, null)).body.some(p => p.id === point.id), false);
    assert.equal((await request('GET', '/pontos-coleta/admin')).body.some(p => p.id === point.id), true);
    assert.equal((await request('DELETE', '/pontos-coleta/' + point.id + '?tipo=reativar')).status, 200);
    assert.equal((await request('DELETE', '/pontos-coleta/' + point.id + '?tipo=invalido')).status, 400);
    const empty = (await request('POST', '/pontos-coleta', { nome: 'Sem pedidos', tipo: 'Ponto Fixo' })).body;
    assert.equal((await request('DELETE', '/pontos-coleta/' + empty.id + '?tipo=hard')).status, 200);
  });

  await t.test('10 kg declarados e 8,7 kg recebidos: uma confirmação em duas requisições simultâneas', async () => {
    const created = await create({ quantidade_kg: 10 });
    const pedido = (await request('GET', '/descartes/protocolo/' + created.body.protocolo)).body;
    const result = await Promise.all([
      request('POST', '/descartes/' + pedido.id + '/recebimento', { peso_recebido_kg: 8.7 }),
      request('POST', '/descartes/' + pedido.id + '/recebimento', { peso_recebido_kg: 8.7 }, token2),
    ]);
    assert.deepEqual(result.map(r => r.status).sort(), [200, 409]);
    receipt = result.find(r => r.status === 200).body;
    assert.equal(receipt.quantidade_kg, 10); assert.equal(receipt.peso_recebido_kg, 8.7);
    assert.equal(receipt.situacao, 'RECEBIDO'); assert.equal(receipt.historico.length, 1);
    assert.equal(receipt.historico[0].tipo, 'RECEBIMENTO'); assert.ok(receipt.recebido_em);
    assert.ok([operator, secondOperator].includes(receipt.recebido_por));
    assert.equal(receipt.historico[0].operador.id, receipt.recebido_por);
    assert.ok(!JSON.stringify(receipt).includes('senha_hash'));
    assert.equal(Number((await db.query("SELECT sum(peso_recebido_kg) AS kg FROM descarte WHERE situacao='RECEBIDO'"))[0].kg), 8.7);
    assert.equal((await request('POST', '/descartes/' + pedido.id + '/recebimento', { peso_recebido_kg: 99 })).status, 409);
  });

  await t.test('pesagem inválida, operador forjado e correção de pendência são rejeitados', async () => {
    for (const payload of [{ peso_recebido_kg: 0 }, { peso_recebido_kg: 1.0001 }, { peso_recebido_kg: 1, recebido_por: secondOperator }]) {
      assert.equal((await request('POST', '/descartes/' + pending.id + '/recebimento', payload)).status, 400);
    }
    assert.equal((await request('PATCH', '/descartes/' + pending.id + '/recebimento', { peso_recebido_kg: 3, motivo: 'Nova pesagem', versao: 1 })).status, 409);
    assert.equal((await request('POST', '/descartes/' + oldId + '/recebimento', { peso_recebido_kg: 3 })).status, 409);
    assert.equal((await request('POST', '/descartes/' + randomUUID() + '/recebimento', { peso_recebido_kg: 3 })).status, 404);
    assert.equal((await request('POST', '/descartes/invalido/recebimento', { peso_recebido_kg: 3 })).status, 400);
  });

  await t.test('correção exige motivo/versão, mantém original e impede sobrescrita concorrente', async () => {
    const path = '/descartes/' + receipt.id + '/recebimento';
    assert.equal((await request('PATCH', path, { peso_recebido_kg: 8.6, motivo: ' ', versao: 1 })).status, 400);
    assert.equal((await request('PATCH', path, { peso_recebido_kg: 8.6, motivo: 'Nova pesagem' })).status, 400);
    const responses = await Promise.all([
      request('PATCH', path, { peso_recebido_kg: 8.6, motivo: 'Conferência da balança', versao: 1 }),
      request('PATCH', path, { peso_recebido_kg: 8.5, motivo: 'Segunda conferência', versao: 1 }, token2),
    ]);
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
    const updated = responses.find(r => r.status === 200).body;
    assert.equal(updated.quantidade_kg, 10); assert.equal(updated.recebido_em, receipt.recebido_em);
    assert.equal(updated.recebido_por, receipt.recebido_por); assert.equal(updated.recebimento_versao, 2);
    assert.equal(updated.historico.length, 2); assert.equal(updated.historico[1].peso_anterior_kg, 8.7);
    assert.equal(updated.historico[1].peso_novo_kg, updated.peso_recebido_kg);
    assert.equal((await request('PATCH', path, { peso_recebido_kg: updated.peso_recebido_kg, motivo: 'Sem mudança', versao: 2 })).status, 409);
  });

  await t.test('banco impede recebimento incompleto e remoção de histórico vinculado', async () => {
    await assert.rejects(db.query("UPDATE descarte SET situacao='RECEBIDO' WHERE id=$1", [pending.id]), { code: '23514' });
    await assert.rejects(db.query('DELETE FROM descarte WHERE id=$1', [receipt.id]), { code: '23503' });
    await assert.rejects(db.undoLastMigration(), /existem recebimentos/);
  });

  await t.test('reinício da API preserva recebimento; estatísticas existentes são declaradas', async () => {
    await app.close();
    app = await NestFactory.create(AppModule, { logger: ['error'], abortOnError: false }); configureApp(app);
    await app.listen(0, '127.0.0.1');
    const response = await fetch(await app.getUrl() + '/api/v1/descartes/protocolo/' + receipt.protocolo, { headers: { Authorization: 'Bearer ' + token } });
    const data = await response.json();
    assert.equal(data.historico.length, 2); assert.equal(data.quantidade_kg, 10); assert.equal(data.situacao, 'RECEBIDO');
    const statsResponse = await fetch(await app.getUrl() + '/api/v1/stats/latest', { headers: { Authorization: 'Bearer ' + token } });
    const stats = await statsResponse.json();
    assert.equal(stats.total_kg, Number((await db.query('SELECT sum(quantidade_kg) AS kg FROM descarte'))[0].kg));
  });
});

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
  const { sessionCookieOptions, sessionCookieName } = require('../dist/modules/auth/session-cookie');
  assert.deepEqual(sessionCookieOptions(true), { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 28800000 });
  assert.equal(sessionCookieName(true), '__Host-sema_session');
  assert.equal(sessionCookieOptions(false).secure, false);
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
  await db.query("INSERT INTO descarte (id, protocolo, quantidade_kg, frequencia_dias, criado_em) VALUES ($1, 'TX-LEGADO', -1, 7, '2026-10-31 02:59:59')", [oldId]);

  await t.test('migração recusa dados inválidos sem apagar registros e preserva legado após correção', async () => {
    await assert.rejects(db.runMigrations({ transaction: 'all' }), /pesos\/frequências inválidos/);
    assert.equal((await db.query('SELECT quantidade_kg FROM descarte WHERE id=$1', [oldId]))[0].quantidade_kg, -1);
    await db.query('UPDATE descarte SET quantidade_kg=5 WHERE id=$1', [oldId]);
    assert.equal((await db.runMigrations({ transaction: 'all' })).length, 6);
    assert.equal((await db.runMigrations()).length, 0);
    const [old] = await db.query('SELECT * FROM descarte WHERE id=$1', [oldId]);
    assert.equal(Number(old.quantidade_kg), 5);
    assert.equal(old.criado_em.toISOString(), '2026-10-31T02:59:59.000Z');
    assert.equal(old.situacao, 'PENDENTE');
    assert.equal(old.peso_recebido_kg, null);
  });

  await t.test('instalação do zero tem as mesmas migrações e colunas', async () => {
    const url = new URL(process.env.DATABASE_URL); url.pathname = '/' + freshName;
    fresh = new DataSource({ ...source.options, url: url.toString() });
    await fresh.initialize();
    assert.equal((await fresh.runMigrations()).length, 6);
    const columns = async connection => connection.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('descarte','ponto_coleta') ORDER BY table_name, ordinal_position");
    assert.deepEqual(await columns(fresh), await columns(db));
    await fresh.undoLastMigration();
    await fresh.undoLastMigration();
    await fresh.query("INSERT INTO ponto_coleta(nome,tipo,dias_semana,horario_inicio,horario_fim,materiais_aceitos) VALUES ('Legado', 'Ponto Fixo', ARRAY[1,5], '09:00', '17:00', 'Retalhos; algodão limpo')");
    assert.equal((await fresh.runMigrations()).length, 2);
    const [migrated] = await fresh.query('SELECT horarios_semana,materiais_lista FROM ponto_coleta');
    assert.deepEqual(migrated.horarios_semana, [{dia:1,inicio:'09:00',fim:'17:00'},{dia:5,inicio:'09:00',fim:'17:00'}]);
    assert.deepEqual(migrated.materiais_lista, ['Retalhos; algodão limpo']);
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
  let endpoint = await app.getUrl() + '/api/v1';
  let token, token2, point, pending, receipt;
  const request = async (method, path, body, auth = token, headers = {}) => {
    const response = await fetch(endpoint + path, {
      method, headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173', ...(auth ? { Cookie: auth } : {}), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
  };

  await t.test('login, token inválido/expirado e usuário removido', async () => {
    assert.equal((await request('POST', '/auth/login', { email: 'operador@example.test', senha: 'errada' }, null)).status, 401);
    const logged = await request('POST', '/auth/login', { email: 'operador@example.test', senha: password }, null);
    assert.equal(logged.status, 201); token = logged.headers.get('set-cookie').split(';')[0];
    assert.equal(logged.body.access_token, undefined);
    assert.equal(logged.headers.get('cache-control'), 'no-store');
    assert.match(logged.headers.get('set-cookie'), /HttpOnly/);
    assert.match(logged.headers.get('set-cookie'), /SameSite=Strict/);
    assert.deepEqual((await request('GET', '/auth/me')).body.usuario, { nome: 'Operador Teste', email: 'operador@example.test' });
    token2 = (await request('POST', '/auth/login', { email: 'dois@example.test', senha: password }, null)).headers.get('set-cookie').split(';')[0];
    assert.equal((await request('GET', '/descartes', undefined, 'sema_session=invalido')).status, 401);
    const jwt = app.get(JwtService);
    const expired = jwt.sign({ sub: operator }, { expiresIn: -1 });
    assert.equal((await request('GET', '/descartes', undefined, 'sema_session=' + expired)).status, 401);
    const absent = jwt.sign({ sub: randomUUID() });
    assert.equal((await request('GET', '/descartes', undefined, 'sema_session=' + absent)).status, 401);
    assert.equal((await request('GET', '/descartes', undefined, null, { Authorization: 'Bearer ' + jwt.sign({ sub: operator }) })).status, 401);
    assert.equal((await request('POST', '/auth/logout', undefined, token, { Origin: 'https://outro.example' })).status, 403);
    assert.equal((await request('POST', '/auth/logout', undefined, token, { Origin: '' })).status, 403);
  });

  await t.test('admin protegido; formulário, pontos ativos e notícias públicos', async () => {
    for (const path of ['/descartes', '/stats/latest', '/pontos-coleta/admin', '/descartes/protocolo/TX-LEGADO', '/relatorios', '/relatorios/csv']) {
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
    const { Receipts1793232002000 } = require('../dist/database/migrations/1793232002000-receipts');
    const runner = db.createQueryRunner();
    try { await assert.rejects(new Receipts1793232002000().down(runner), /existem recebimentos/); }
    finally { await runner.release(); }
  });

  await t.test('ponto editável, campos operacionais, limites e validação preservam o histórico', async () => {
    const fields = { nome: 'Ponto configurável', tipo: 'Ponto Fixo', dias_semana: [1,3,5],
      data_inicio: '2026-10-30', data_fim: '2026-11-30', horario_inicio: '09:00', horario_fim: '17:00',
      materiais_aceitos: 'Retalhos limpos', limite_kg_por_pedido: 2.5, orientacoes: 'Levar o protocolo', lat: -23.55, lon: -51.46 };
    const created = await request('POST', '/pontos-coleta', fields);
    assert.equal(created.status, 201);
    const id = created.body.id;
    assert.equal((await request('PUT', '/pontos-coleta/' + id, fields, null)).status, 401);
    for (const change of [{ dias_semana: [7] }, { dias_semana: [1,1] }, { dias_semana: null, nome: null },
      { data_inicio: '2026-02-30' }, { data_inicio: '2026-12-01' }, { horario_fim: '08:00' },
      { horario_fim: null }, { limite_kg_por_pedido: 0 }, { limite_kg_por_pedido: 2.5001 }, { lon: null }]) {
      assert.equal((await request('PUT', '/pontos-coleta/' + id, { ...fields, ...change })).status, 400, JSON.stringify(change));
    }
    assert.equal((await create({ ponto_coleta_id: id, quantidade_kg: 2.501 })).status, 400);
    const registered = await create({ ponto_coleta_id: id, quantidade_kg: 2.5 });
    assert.equal(registered.status, 201);
    const changed = await request('PUT', '/pontos-coleta/' + id, { ...fields, nome: 'Novo nome', limite_kg_por_pedido: null, dias_semana: [] });
    assert.equal(changed.status, 200); assert.equal(changed.body.limite_kg_por_pedido, null);
    const publicPoint = (await request('GET', '/pontos-coleta', undefined, null)).body.find(p => p.id === id);
    assert.equal(publicPoint.nome, 'Novo nome'); assert.equal(publicPoint.orientacoes, fields.orientacoes);
    assert.equal(publicPoint.horario_inicio, '09:00'); assert.deepEqual(publicPoint.dias_semana, []);
    const detail = (await request('GET', '/descartes/protocolo/' + registered.body.protocolo)).body;
    assert.equal(detail.quantidade_kg, 2.5); assert.equal(detail.ponto_coleta.id, id);
    assert.equal((await request('PUT', '/pontos-coleta/' + randomUUID(), fields)).status, 404);
    const { PointOperation1793232003000 } = require('../dist/database/migrations/1793232003000-point-operation');
    const runner = db.createQueryRunner();
    try { await assert.rejects(new PointOperation1793232003000().down(runner), /condições de atendimento cadastradas/); }
    finally { await runner.release(); }
  });

  await t.test('horários por dia e materiais múltiplos são validados e persistidos', async () => {
    const fields = { nome: 'Agenda semanal', tipo: 'Ponto Fixo',
      horarios_semana: [{dia:1,inicio:'09:00',fim:'17:00'},{dia:5,inicio:'10:00',fim:'15:30'}],
      materiais_lista: ['Retalho de corte', 'Material especial deste ponto'] };
    const created = await request('POST','/pontos-coleta',fields);
    assert.equal(created.status,201);
    assert.deepEqual(created.body.horarios_semana,fields.horarios_semana);
    assert.deepEqual(created.body.materiais_lista,fields.materiais_lista);
    assert.equal(created.body.data_inicio,null); assert.equal(created.body.data_fim,null);
    for (const change of [
      {horarios_semana:[{dia:7,inicio:'09:00',fim:'17:00'}]},
      {horarios_semana:[{dia:1,inicio:'17:00',fim:'09:00'}]},
      {horarios_semana:[{dia:1,inicio:'09:00',fim:'09:00'}]},
      {horarios_semana:[{dia:1,inicio:'09:00'}]},
      {horarios_semana:[{dia:1,inicio:'25:00',fim:'26:00'}]},
      {horarios_semana:[fields.horarios_semana[0],fields.horarios_semana[0]]},
      {materiais_lista:['  ']}, {materiais_lista:['Algodão','algodão']},
      {materiais_lista:[1]}, {materiais_lista:Array.from({length:51},(_,i)=>'Material '+i)}
    ]) assert.equal((await request('PUT','/pontos-coleta/'+created.body.id,{...fields,...change})).status,400,JSON.stringify(change));
    const changed = await request('PUT','/pontos-coleta/'+created.body.id,{
      ...fields,horarios_semana:[fields.horarios_semana[1]],materiais_lista:['Material especial deste ponto']
    });
    assert.equal(changed.status,200);
    const publicPoint = (await request('GET','/pontos-coleta',undefined,null)).body.find(p=>p.id===created.body.id);
    assert.deepEqual(publicPoint.horarios_semana,[fields.horarios_semana[1]]);
    assert.deepEqual(publicPoint.dias_semana,[5]);
    assert.deepEqual(publicPoint.materiais_lista,['Material especial deste ponto']);
    const cleared = await request('PUT','/pontos-coleta/'+created.body.id,{...fields,horarios_semana:[],materiais_lista:[]});
    assert.deepEqual(cleared.body.horarios_semana,[]); assert.deepEqual(cleared.body.materiais_lista,[]);
  });

  await t.test('relatórios e CSV: filtros, somas decimais, correção, fuso e exportação vazia', async () => {
    const p = (await request('POST', '/pontos-coleta', { nome: '=Ponto;"teste"', tipo: 'Ponto Fixo' })).body;
    const a = await create({ ponto_coleta_id: p.id, quantidade_kg: 10, material: 'Algodão; "limpo"\nseco' });
    const b = await create({ ponto_coleta_id: p.id, quantidade_kg: 2.5, residuo_principal: 'Fios' });
    const da = (await request('GET', '/descartes/protocolo/' + a.body.protocolo)).body;
    const dbb = (await request('GET', '/descartes/protocolo/' + b.body.protocolo)).body;
    assert.equal((await request('POST', '/descartes/' + da.id + '/recebimento', { peso_recebido_kg: 8.7 })).status, 200);
    assert.equal((await request('PATCH', '/descartes/' + da.id + '/recebimento', { peso_recebido_kg: 8.6, versao: 1, motivo: 'Aferição controlada' })).status, 200);
    await db.query("UPDATE descarte SET criado_em='2026-10-31T02:59:59Z', recebido_em='2026-11-01T02:30:00Z' WHERE id=$1", [da.id]);
    await db.query("UPDATE descarte SET criado_em='2026-10-31T03:00:00Z' WHERE id=$1", [dbb.id]);
    const filtro = '?ponto_coleta_id=' + p.id;
    const all = (await request('GET', '/relatorios' + filtro)).body;
    assert.deepEqual(all.totais, { registros: 2, pendentes: 1, recebidos: 1, peso_declarado_kg: 12.5, peso_recebido_kg: 8.6 });
    assert.deepEqual(all.por_ponto[0], { chave: p.id, nome: p.nome, ...all.totais });
    assert.equal(all.por_residuo.find(r => r.nome === 'Retalhos').peso_recebido_kg, 8.6);
    assert.equal(all.registros.length, 2);
    const day = (await request('GET', '/relatorios' + filtro + '&inicio=2026-10-30&fim=2026-10-30')).body;
    assert.equal(day.totais.registros, 1); assert.equal(day.registros[0].protocolo, a.body.protocolo);
    assert.equal(day.registros[0].criado_em, '2026-10-30 23:59:59');
    const nextDay = (await request('GET', '/relatorios' + filtro + '&inicio=2026-10-31&fim=2026-10-31')).body;
    assert.deepEqual(nextDay.registros.map(r => r.protocolo), [b.body.protocolo]);
    assert.equal(nextDay.registros[0].criado_em, '2026-10-31 00:00:00');
    const detail = (await request('GET', '/descartes/protocolo/' + a.body.protocolo)).body;
    assert.equal(detail.criado_em, '2026-10-31T02:59:59.000Z');
    const received = (await request('GET', '/relatorios' + filtro + '&base_data=recebimento&inicio=2026-10-31&fim=2026-10-31&situacao=RECEBIDO&residuo_principal=Retalhos')).body;
    assert.equal(received.totais.registros, 1); assert.equal(received.totais.peso_recebido_kg, 8.6);
    assert.equal(received.registros[0].recebido_em, '2026-10-31 23:30:00');
    const emptyFilter = filtro + '&base_data=recebimento&inicio=2026-11-01&fim=2026-11-01';
    const empty = (await request('GET', '/relatorios' + emptyFilter)).body;
    assert.deepEqual(empty.totais, { registros: 0, pendentes: 0, recebidos: 0, peso_declarado_kg: 0, peso_recebido_kg: 0 });
    assert.deepEqual(empty.registros, []); assert.deepEqual(empty.por_ponto, []); assert.deepEqual(empty.por_residuo, []);
    for (const filter of ['?inicio=2026-11-01&fim=2026-10-30', '?inicio=2026-02-30', '?base_data=invalida', '?situacao=APROVADO', '?ponto_coleta_id=texto', '?campo_inventado=1']) {
      assert.equal((await request('GET', '/relatorios' + filter)).status, 400, filter);
    }
    // Ler CSV com aspas, ponto e vírgula e quebras de linha nos campos.
    function parseCsv(text) {
      const rows = []; let row = [], field = '', quoted = false;
      text = text.replace(/^\uFEFF/, '');
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
        else if (!quoted && c === ';') { row.push(field); field = ''; }
        else if (!quoted && c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
        else field += c;
      }
      return rows;
    }
    const csv = async filter => {
      const response = await fetch(endpoint + '/relatorios/csv' + filter, { headers: { Cookie: token } });
      assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /text\/csv/);
      return parseCsv(await response.text());
    };
    const rows = await csv(filtro);
    assert.equal(rows.length, 3);
    const data = rows.slice(1);
    assert.deepEqual(new Set(data.map(r => r[0])), new Set(all.registros.map(r => r.protocolo)));
    assert.equal(data.reduce((sum, r) => sum + Math.round(Number(r[5].replace(',', '.')) * 1000), 0) / 1000, all.totais.peso_declarado_kg);
    assert.equal(data.reduce((sum, r) => sum + Math.round(Number(r[6].replace(',', '.')) * 1000), 0) / 1000, all.totais.peso_recebido_kg);
    assert.equal(data[0][3], "'" + p.nome);
    assert.equal(data.find(r => r[0] === a.body.protocolo)[1], day.registros[0].criado_em);
    assert.equal(data.find(r => r[0] === a.body.protocolo)[10], 'Algodão; "limpo"\nseco');
    assert.equal((await csv(emptyFilter)).length, 1);
    assert.equal((await csv(filtro + '&situacao=PENDENTE'))[1][0], b.body.protocolo);
  });

  await t.test('reinício da API preserva recebimento; estatísticas existentes são declaradas', async () => {
    await app.close();
    app = await NestFactory.create(AppModule, { logger: ['error'], abortOnError: false }); configureApp(app);
    await app.listen(0, '127.0.0.1');
    endpoint = await app.getUrl() + '/api/v1';
    const response = await fetch(await app.getUrl() + '/api/v1/descartes/protocolo/' + receipt.protocolo, { headers: { Cookie: token } });
    const data = await response.json();
    assert.equal(data.historico.length, 2); assert.equal(data.quantidade_kg, 10); assert.equal(data.situacao, 'RECEBIDO');
    const statsResponse = await fetch(await app.getUrl() + '/api/v1/stats/latest', { headers: { Cookie: token } });
    const stats = await statsResponse.json();
    assert.equal(stats.total_kg, Number((await db.query('SELECT sum(quantidade_kg) AS kg FROM descarte'))[0].kg));
  });

  await t.test('sessão, origem e limites de requisições na API', async () => {
    assert.equal((await request('POST', '/pontos-coleta', { nome: 'Bloqueado', tipo: 'Ponto Fixo' }, token, { Origin: 'https://outro.example' })).status, 403);
    assert.equal((await request('POST', '/pontos-coleta', { nome: 'Bloqueado', tipo: 'Ponto Fixo' }, token, { Origin: '' })).status, 403);
    const logout = await request('POST', '/auth/logout', undefined, token);
    assert.equal(logout.status, 201);
    assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
    assert.equal((await request('GET', '/auth/me', undefined, null)).status, 401);
    for (let i = 0; i < 15; i++) {
      const result = await request('POST', '/auth/login', { email: 'operador@example.test', senha: 'errada' }, null, { 'X-Forwarded-For': '198.51.100.' + i });
      assert.equal(result.status, 401, 'login ' + i);
    }
    const limitedLogin = await request('POST', '/auth/login', { email: 'operador@example.test', senha: 'errada' }, null);
    assert.equal(limitedLogin.status, 429);
    assert.ok(Number(limitedLogin.headers.get('retry-after')) > 0);
    assert.equal((await request('POST', '/AUTH/LOGIN/', { email: 'operador@example.test', senha: 'errada' }, null)).status, 429);
    for (let i = 0; i < 30; i++) assert.equal((await request('POST', '/descartes', {}, null)).status, 400, 'registro ' + i);
    const limitedRegistration = await request('POST', '/descartes', {}, null);
    assert.equal(limitedRegistration.status, 429);
    assert.ok(Number(limitedRegistration.headers.get('retry-after')) > 0);
    assert.equal((await request('POST', '/DESCARTES/', {}, null)).status, 429);
  });
});

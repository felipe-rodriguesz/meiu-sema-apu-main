import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { readFile } from 'node:fs/promises';

const origin = new URL(process.env.E2E_BASE_URL || 'http://localhost:8080/admin/').origin;
const api = process.env.E2E_API_URL || origin + '/api/v1';
if (![origin, api].every(v => ['localhost','127.0.0.1'].includes(new URL(v).hostname))) throw new Error('Somente localhost: estes testes criam dados fictícios.');
const email = process.env.E2E_EMAIL;
const senha = process.env.E2E_PASSWORD;
if (!email || !senha) throw new Error('Configure a conta local E2E_EMAIL/E2E_PASSWORD.');

async function login(page: Page) {
  await page.getByPlaceholder('admin@admin-sema.com').fill(email!);
  await page.locator('input[type=password]').fill(senha!);
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
}
async function formulario(page: Page, peso: string) {
  await page.goto(origin + '/');
  await page.getByRole('button', { name: 'Entendi e quero continuar' }).click();
  await page.getByRole('button', { name: 'Não, é um tipo só' }).click();
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await page.getByRole('button', { name: 'Retalho de corte', exact: true }).click();
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await page.getByLabel('Quantidade aproximada em kg').fill(peso);
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
}
async function detalhes(page: Page) {
  await page.getByLabel('Composição principal').selectOption('Algodão');
  await page.getByLabel('Estado do material').selectOption('Limpo');
  await page.getByLabel('Tipo de tecido / aplicação').selectOption('Tecido plano');
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
}

for (const width of [1365, 390]) test('formulário sem localização, edição do ponto, QR, recebimento e CSV em ' + width + 'px', async ({ page, request }, info) => {
  await page.setViewportSize({ width, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // Negar localização e armazenamento: ambos precisam ser opcionais para registrar.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: (_ok: unknown, fail: (e: unknown) => void) => fail({ code: 1 }) } });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v) { if (k.startsWith('pedido-coleta-')) throw new DOMException('Storage bloqueado'); return original.call(this, k, v); };
  });
  const auth = await request.post(api + '/auth/login', { data: { email, senha } });
  expect(auth.status()).toBe(201);
  const headers = { Origin: origin };
  const nome = 'Ponto fictício integrado ' + randomUUID().slice(0,8);
  const created = await request.post(api + '/pontos-coleta', { headers, data: { nome, tipo: 'Ponto Fixo', bairro: 'Centro', endereco: 'Endereço fictício', lat: -23.5522, lon: -51.46 } });
  expect(created.status()).toBe(201);
  const ponto = await created.json();
  await page.goto(origin + '/admin/'); await login(page);
  await page.getByRole('row').filter({ hasText: nome }).getByRole('button', { name: 'Editar ponto' }).click();
  await expect(page.getByLabel('Segunda', { exact: true })).toBeDisabled();
  await page.getByLabel('Início do horário padrão', { exact: true }).fill('09:00');
  await page.getByLabel('Fim do horário padrão', { exact: true }).fill('17:00');
  await page.getByLabel('Segunda', { exact: true }).check();
  await page.getByLabel('Sexta', { exact: true }).check();
  await page.getByRole('button', { name: 'Personalizar Sexta', exact: true }).click();
  await page.getByLabel('Início de Sexta', { exact: true }).fill('10:00');
  await page.getByLabel('Fim de Sexta', { exact: true }).fill('15:30');
  await expect(page.getByText('5h 30min de atendimento')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Retalho de corte', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Outro', exact: true }).check();
  await page.getByLabel('Nome do material', { exact: true }).fill('Retalhos de algodão limpos e secos');
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await page.getByLabel('Limite por pedido (kg)').fill('10,5');
  await page.getByLabel('Orientações para entrega').fill('Apresente o protocolo ao atendente. Dados fictícios de teste.');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dados Cadastrais da SEMA' })).toBeVisible();
  const updated = (await (await request.get(api + '/pontos-coleta/admin', { headers })).json()).find((p: {id: string}) => p.id === ponto.id);
  expect(updated.limite_kg_por_pedido).toBe(10.5); expect(updated.dias_semana).toEqual([1,5]);
  expect(updated.horarios_semana).toEqual([{dia:1,inicio:'09:00',fim:'17:00'},{dia:5,inicio:'10:00',fim:'15:30'}]);
  expect(updated.materiais_lista).toEqual(['Retalho de corte','Retalhos de algodão limpos e secos']);
  await formulario(page, '10');
  await detalhes(page);
  const card = page.getByRole('article').filter({ hasText: nome });
  await expect(card.getByText('Segunda: 09:00 às 17:00')).toBeVisible();
  await expect(card.getByText('Sexta: 10:00 às 15:30')).toBeVisible();
  await expect(card.getByText('Retalhos de algodão limpos e secos')).toBeVisible();
  await card.getByRole('button', { name: 'Selecionar', exact: true }).click();
  const response = page.waitForResponse(r => r.url() === api + '/descartes' && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Gerar pedido', exact: true }).click();
  const registered = await response;
  expect(registered.status()).toBe(201);
  const payload = registered.request().postDataJSON();
  expect(payload.quantidade_kg).toBe(10); expect(payload.lat).toBeUndefined(); expect(payload.lon).toBeUndefined();
  const { protocolo } = await registered.json();
  await expect(page.getByRole('heading', { name: 'Seu descarte foi registrado' })).toBeVisible();
  const image = page.getByAltText('QR Code do protocolo para consulta pelo operador');
  await expect(image).toBeVisible();
  const src = await image.getAttribute('src');
  const png = PNG.sync.read(Buffer.from(src!.split(',')[1], 'base64'));
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  expect(decoded?.data).toBe(origin + '/admin/?protocolo=' + protocolo);
  const qrUrl = new URL(decoded!.data);
  expect([...qrUrl.searchParams.keys()]).toEqual(['protocolo']);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Baixar QR Code' }).click()]);
  expect(download.suggestedFilename()).toBe(protocolo + '.png');
  await page.screenshot({ path: info.outputPath('protocolo-' + width + '.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBeFalsy();
  // Em um dispositivo sem sessão, o QR solicita login e preserva o protocolo.
  await page.context().clearCookies();
  await page.goto(decoded!.data); await login(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: protocolo })).toBeVisible();
  await dialog.getByLabel('Peso aferido (kg)').fill('8,7');
  await dialog.getByLabel('Conferi o material e a pesagem.').check();
  await dialog.getByRole('button', { name: 'Confirmar recebimento', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('Recebimento confirmado.');
  await dialog.getByRole('button', { name: 'Fechar pedido' }).click();
  await page.getByRole('button', { name: 'Relatórios', exact: true }).click();
  await page.getByRole('combobox', { name: 'Ponto de coleta', exact: true }).selectOption(ponto.id);
  await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
  const totals = page.locator('.relatorio-totais');
  await expect(page.getByText('Filtros alterados.', { exact: false })).toHaveCount(0);
  await expect(totals).toContainText('10,000'); await expect(totals).toContainText('8,700');
  const [csv] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar CSV dos filtros aplicados' }).click()]);
  const contents = await readFile((await csv.path())!, 'utf8');
  expect(contents).toContain(protocolo); expect(contents).toContain('"10,000";"8,700"');
  expect(contents.trim().split('\r\n')).toHaveLength(2);
  await page.screenshot({ path: info.outputPath('relatorio-' + width + '.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBeFalsy();
  await page.getByRole('combobox', { name: 'Situação', exact: true }).selectOption('PENDENTE');
  await expect(page.getByRole('button', { name: 'Exportar CSV dos filtros aplicados' })).toBeDisabled();
  await expect(page.getByText('Filtros alterados.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
  await expect(page.getByText('Nenhum registro encontrado para os filtros.')).toBeVisible();
  expect(errors).toEqual([]);
  await request.delete(api + '/pontos-coleta/' + ponto.id + '?tipo=soft', { headers });
});

test('localização permitida ordena pontos sem enviar origem e limite impede envio', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: {
    getCurrentPosition: (ok: (p: unknown) => void) => ok({ coords: { latitude: -23.5522, longitude: -51.46 } })
  } }));
  const near = { id: randomUUID(), nome: 'Ponto próximo fictício', tipo: 'Ponto Fixo', status: 'ATIVO', lat: -23.5522, lon: -51.46, limite_kg_por_pedido: 2.5 };
  const far = { ...near, id: randomUUID(), nome: 'Ponto distante fictício', lat: -23.6 };
  await page.route('**/api/v1/pontos-coleta', route => route.fulfill({ json: [far, near] }));
  let submitted = 0;
  await page.route('**/api/v1/descartes', async route => {
    submitted++;
    const payload = route.request().postDataJSON();
    expect(payload.quantidade_kg).toBe(2.5);
    expect(payload.lat).toBeUndefined(); expect(payload.lon).toBeUndefined();
    await route.fulfill({ status: 201, json: { protocolo: 'TX-TESTE-LOCAL', status: 'success', ponto_coleta_id: near.id } });
  });
  await formulario(page, '2,501'); await detalhes(page);
  await expect(page.getByRole('article').first()).toContainText(near.nome);
  await page.getByRole('article').first().getByRole('button', { name: 'Selecionar', exact: true }).click();
  await page.getByRole('button', { name: 'Gerar pedido', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('excede o limite');
  expect(submitted).toBe(0);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByLabel('Quantidade aproximada em kg').fill('2,5');
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await page.getByRole('button', { name: 'Gerar pedido', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seu descarte foi registrado' })).toBeVisible();
  expect(submitted).toBe(1);
});

test('peso decimal, erro da API preservado e recuperação da lista de pontos', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: () => {} } }));
  const point = { id: randomUUID(), nome: 'Ponto de teste isolado', tipo: 'Ponto Fixo', status: 'ATIVO', materiais_aceitos: 'Retalhos', limite_kg_por_pedido: 2.5 };
  let failedList = true;
  await page.route('**/api/v1/pontos-coleta', route => failedList ? route.fulfill({ status: 503, json: { message: 'Indisponível' } }) : route.fulfill({ json: [point] }));
  await formulario(page, '0');
  await expect(page.getByRole('alert')).toContainText('peso positivo');
  for (const peso of ['-1','1,2345','1000000000']) {
    await page.getByLabel('Quantidade aproximada em kg').fill(peso);
    await page.getByRole('button', { name: 'Próximo', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('peso positivo');
  }
  await page.getByLabel('Quantidade aproximada em kg').fill('2,5');
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await detalhes(page);
  await expect(page.getByRole('alert')).toContainText('carregar os pontos');
  failedList = false;
  await page.getByRole('button', { name: 'Atualizar pontos' }).click();
  await page.getByRole('button', { name: 'Selecionar', exact: true }).click();
  await page.route('**/api/v1/descartes', async route => {
    expect(route.request().postDataJSON().quantidade_kg).toBe(2.5);
    await route.fulfill({ status: 400, json: { message: 'Selecione um ponto de coleta existente e ativo.' } });
  });
  await page.getByRole('button', { name: 'Gerar pedido', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Selecione um ponto de coleta existente e ativo.');
  await expect(page.getByRole('button', { name: 'Selecionado', exact: true })).toBeVisible();
});

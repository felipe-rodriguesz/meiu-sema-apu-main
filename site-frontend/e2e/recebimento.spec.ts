import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const panel = process.env.E2E_BASE_URL || 'http://localhost:8080/admin/';
const api = process.env.E2E_API_URL || 'http://localhost:8080/api/v1';
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
if (![panel, api].every(url => ['localhost', '127.0.0.1'].includes(new URL(url).hostname))) {
  throw new Error('Estes testes criam dados fictícios e só podem executar em localhost.');
}
if (!email || !password) throw new Error('Configure E2E_EMAIL e E2E_PASSWORD para uma conta local de teste.');

for (const viewport of [{ width: 1365, height: 900 }, { width: 390, height: 844 }]) {
  test('recebimento, correção e sessão em ' + viewport.width + 'px', async ({ page, request }, testInfo) => {
    await page.setViewportSize(viewport);
    const logged = await request.post(api + '/auth/login', { data: { email, senha: password } });
    expect(logged.ok()).toBeTruthy();
    const headers = { Origin: new URL(api).origin };
    const pointResponse = await request.post(api + '/pontos-coleta', {
      headers, data: { nome: 'Ponto fictício E2E ' + randomUUID().slice(0, 8), tipo: 'Ponto Fixo', bairro: 'Centro', endereco: 'Endereço de teste' }
    });
    const point = await pointResponse.json();
    const created = await request.post(api + '/descartes', { headers, data: {
      ponto_coleta_id: point.id, quantidade_kg: 10, frequencia_dias: 7, eh_mistura: false,
      residuo_principal: 'Retalhos', material: 'Algodão', estado_material: 'Limpo', tipo_tecido: 'Plano'
    } });
    expect(created.status()).toBe(201);
    const { protocolo } = await created.json();
    const link = panel + '?protocolo=' + encodeURIComponent(protocolo);
    await page.goto(link);
    const login = async () => {
      await page.getByPlaceholder('admin@admin-sema.com').fill(email!);
      await page.locator('input[type="password"]').fill(password!);
      await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    };
    await login();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: protocolo })).toBeVisible();
    await dialog.getByLabel('Peso aferido (kg)').fill('8,7');
    await dialog.getByLabel('Conferi o material e a pesagem.').check();
    await dialog.getByRole('button', { name: 'Confirmar recebimento', exact: true }).click();
    await expect(dialog.getByRole('status')).toHaveText('Recebimento confirmado.');
    await expect(dialog.getByText('10 kg', { exact: true })).toBeVisible();
    await expect(dialog.getByText('8,7 kg', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Corrigir peso com justificativa' }).click();
    await dialog.getByLabel('Peso aferido (kg)').fill('8,6');
    await dialog.getByLabel('Motivo da correção').fill('Conferência controlada da balança');
    await dialog.getByLabel('Conferi o material e a pesagem.').check();
    await dialog.getByRole('button', { name: 'Salvar correção', exact: true }).click();
    await expect(dialog.getByRole('status')).toHaveText('Correção registrada no histórico.');
    await expect(dialog.getByText('8,6 kg', { exact: true })).toBeVisible();
    await page.reload();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('8,6 kg', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('recebimento-' + viewport.width + '.png'), fullPage: true });
    const current = await (await request.get(api + '/descartes/protocolo/' + protocolo, { headers })).json();
    expect(current.quantidade_kg).toBe(10);
    expect(current.peso_recebido_kg).toBe(8.6);
    expect(current.historico).toHaveLength(2);
    expect(current.historico[1].motivo).toBe('Conferência controlada da balança');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBeFalsy();

    await page.route('**/api/v1/descartes', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Unauthorized"}' }));
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Acesso Restrito' })).toBeVisible();
    await page.unroute('**/api/v1/descartes');
    await login();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: protocolo })).toBeVisible();
    await dialog.getByRole('button', { name: 'Fechar pedido' }).click();
    await page.getByLabel('Localizar protocolo').fill(protocolo);
    await page.getByRole('button', { name: 'Abrir pedido', exact: true }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('8,6 kg', { exact: true })).toBeVisible();
  });
}

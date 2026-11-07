import { test, expect } from '@playwright/test';

const panel = process.env.E2E_BASE_URL || 'http://localhost:8080/admin/';
const geocoder = 'https://nominatim.openstreetmap.org/reverse**';
const answer = (fields: Record<string, string>) => ({
  features: [{ properties: { geocoding: { label: 'Praça Rui Barbosa, Apucarana, Paraná, Brasil', city: 'Apucarana', ...fields } } }]
});

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/auth/login', route => route.fulfill({
    json: { usuario: { nome: 'Operador de teste', email: 'teste@example.test' } }
  }));
  await page.route('**/api/v1/auth/me', route => route.fulfill({ status: 401, json: { message: 'Unauthorized' } }));
  await page.route('**/api/v1/pontos-coleta/admin', route => route.fulfill({ json: [] }));
  await page.goto(panel);
  await page.getByPlaceholder('admin@admin-sema.com').fill('teste@example.test');
  await page.locator('input[type=password]').fill('senha-ficticia-de-teste');
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
  await expect(page.getByRole('heading', { name: 'Dados Cadastrais da SEMA' })).toBeVisible();
});

test('preenche bairro retornado como localidade, removendo a cidade repetida', async ({ page }) => {
  await page.route(geocoder, route => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('format')).toBe('geocodejson');
    return route.fulfill({ json: answer({ locality: 'Centro, Apucarana' }) });
  });
  await page.locator('.leaflet-container').click();
  await expect(page.getByLabel('Bairro:', { exact: true })).toHaveValue('Centro');
  await expect(page.getByLabel('Endereço Geocodificado:')).toHaveValue('Praça Rui Barbosa, Apucarana, Paraná, Brasil');
  await expect(page.locator('#localizacao-status')).toContainText('Endereço e bairro encontrados');
});

test('preenche bairro retornado como distrito', async ({ page }) => {
  await page.route(geocoder, route => route.fulfill({ json: answer({ district: 'Vila Nova' }) }));
  await page.locator('.leaflet-container').click();
  await expect(page.getByLabel('Bairro:', { exact: true })).toHaveValue('Vila Nova');
});

test('novo ponto sem bairro limpa o anterior e permite informar e salvar manualmente', async ({ page }) => {
  let count = 0;
  await page.route(geocoder, route => route.fulfill({
    json: answer(++count === 1 ? { locality: 'Centro' } : { locality: 'Apucarana' })
  }));
  await page.locator('.leaflet-container').click({ position: { x: 140, y: 100 } });
  await expect(page.getByLabel('Bairro:', { exact: true })).toHaveValue('Centro');
  await page.locator('.leaflet-container').click({ position: { x: 240, y: 180 } });
  await expect(page.locator('#localizacao-status')).toContainText('mapa não informou o bairro');
  await expect(page.getByLabel('Bairro:', { exact: true })).toHaveValue('');
  await page.getByLabel('Bairro:', { exact: true }).fill('Bairro informado manualmente');
  await page.locator('input[name=nome]').fill('Ponto fictício');
  let saved: Record<string, unknown> | undefined;
  await page.route('**/api/v1/pontos-coleta', async route => {
    saved = route.request().postDataJSON();
    await route.fulfill({ json: { id: 'ponto-ficticio' } });
  });
  await page.getByRole('button', { name: 'Gravar Ponto no Sistema' }).click();
  await expect.poll(() => saved?.bairro).toBe('Bairro informado manualmente');
});

test('falha do geocodificador permite preenchimento manual', async ({ page }) => {
  await page.route(geocoder, route => route.abort('failed'));
  await page.locator('.leaflet-container').click();
  await expect(page.locator('#localizacao-status')).toContainText('Preencha os campos manualmente');
  await expect(page.getByRole('button', { name: 'Gravar Ponto no Sistema' })).toBeEnabled();
  await page.getByLabel('Bairro:', { exact: true }).fill('Centro');
  await expect(page.getByLabel('Bairro:', { exact: true })).toHaveValue('Centro');
});

test('resposta automática preserva o bairro digitado durante a busca', async ({ page }) => {
  let release!: () => void;
  let started = false;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(geocoder, async route => {
    started = true;
    await gate;
    await route.fulfill({ json: answer({ locality: 'Centro' }) });
  });
  await page.locator('.leaflet-container').click();
  await expect.poll(() => started).toBe(true);
  await page.getByLabel('Bairro:', { exact: true }).fill('Bairro conferido pelo operador');
  release();
  await expect(page.locator('#localizacao-status')).toContainText('Endereço e bairro encontrados');
  await expect(page.getByLabel('Bairro:', { exact: true })).toHaveValue('Bairro conferido pelo operador');
});

test('seleção mais recente prevalece sobre consulta atrasada', async ({ page }) => {
  let firstStarted = false;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let count = 0;
  await page.route(geocoder, async route => {
    if (++count === 1) {
      firstStarted = true;
      await gate;
      await route.fulfill({ json: answer({ locality: 'Bairro anterior' }) }).catch(() => {});
    } else {
      await route.fulfill({ json: answer({ locality: 'Bairro do último ponto' }) });
    }
  });
  await page.locator('.leaflet-container').click({ position: { x: 140, y: 100 } });
  await expect.poll(() => firstStarted).toBe(true);
  await page.locator('.leaflet-container').click({ position: { x: 240, y: 180 } });
  await expect(page.getByLabel('Bairro:', { exact: true })).toHaveValue('Bairro do último ponto');
  release();
  await expect(page.getByLabel('Bairro:', { exact: true })).toHaveValue('Bairro do último ponto');
});

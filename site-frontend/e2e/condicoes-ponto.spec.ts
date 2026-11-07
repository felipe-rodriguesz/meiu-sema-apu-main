import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const panel = process.env.E2E_BASE_URL || 'http://localhost:8080/admin/';
const api = process.env.E2E_API_URL || 'http://localhost:8080/api/v1';
if (![panel,api].every(url => ['localhost','127.0.0.1'].includes(new URL(url).hostname))) throw new Error('Somente ambiente local.');
for (const width of [1440,390,320]) {
  test('condições de atendimento: layout, edição e persistência em '+width+'px', async ({page,request}, info) => {
    await page.setViewportSize({width,height:1000});
    const email = process.env.E2E_EMAIL!, senha = process.env.E2E_PASSWORD!;
    const loginResponse = await request.post(api+'/auth/login',{data:{email,senha}});
    expect(loginResponse.status()).toBe(201);
    const headers = {Origin:new URL(api).origin};
    const nome = 'Ponto fictício agenda '+randomUUID().slice(0,8);
    const point = await (await request.post(api+'/pontos-coleta',{headers,data:{
      nome,tipo:'Ponto Fixo',bairro:'Centro',endereco:'Endereço fictício de teste',lat:-23.55,lon:-51.46,
      horarios_semana:[{dia:1,inicio:'08:00',fim:'16:00'}],
      materiais_lista:['Retalho de corte']
    }})).json();
    // Login via UI is covered by the flow/receipt tests; reuse this test's session.
    await page.context().addCookies((await request.storageState()).cookies);
    await page.goto(panel);
    const editar = async () => page.getByRole('row').filter({hasText:nome}).getByRole('button',{name:'Editar ponto'}).click();
    await editar();
    await expect(page.getByLabel('Atendimento a partir de',{exact:true})).toHaveCount(0);
    await expect(page.getByLabel('Atendimento até',{exact:true})).toHaveCount(0);
    await expect(page.getByLabel('Início do horário padrão',{exact:true})).toHaveValue('08:00');
    await page.getByRole('checkbox',{name:'Segunda',exact:true}).uncheck();
    await expect(page.getByLabel('Início de Segunda',{exact:true})).toHaveCount(0);
    await page.getByLabel('Início do horário padrão',{exact:true}).fill('09:30');
    await page.getByLabel('Fim do horário padrão',{exact:true}).fill('15:00');
    await page.getByRole('checkbox',{name:'Terça',exact:true}).check();
    await page.getByRole('checkbox',{name:'Quarta',exact:true}).check();
    await page.getByRole('button',{name:'Personalizar Quarta',exact:true}).click();
    await page.getByLabel('Início de Quarta',{exact:true}).fill('10:00');
    await page.getByLabel('Fim de Quarta',{exact:true}).fill('14:00');
    await page.getByLabel('Fim do horário padrão',{exact:true}).fill('16:00');
    await expect(page.getByLabel('Fim de Quarta',{exact:true})).toHaveValue('14:00');
    await page.getByRole('button',{name:'Personalizar Terça',exact:true}).click();
    await expect(page.getByLabel('Fim de Terça',{exact:true})).toHaveValue('16:00');
    await page.getByRole('button',{name:'Usar horário padrão em Terça',exact:true}).click();
    await page.getByRole('button',{name:'Usar horário padrão em Quarta',exact:true}).click();
    await page.getByRole('button',{name:'Personalizar Quarta',exact:true}).click();
    await expect(page.getByLabel('Fim de Quarta',{exact:true})).toHaveValue('16:00');
    await page.getByRole('checkbox',{name:'Quarta',exact:true}).uncheck();
    await page.getByLabel('Fim do horário padrão',{exact:true}).fill('15:00');
    await expect(page.getByText('5h 30min de atendimento por dia')).toBeVisible();
    await page.getByRole('checkbox',{name:'Apara de tecido',exact:true}).check();
    await page.getByRole('checkbox',{name:'Outro',exact:true}).check();
    await page.getByLabel('Nome do material',{exact:true}).fill('Material especial teste');
    await page.getByRole('button',{name:'Adicionar',exact:true}).click();
    await page.getByLabel('Nome do material',{exact:true}).fill('material especial teste');
    await page.getByRole('button',{name:'Adicionar',exact:true}).click();
    await expect(page.getByRole('alert')).toHaveText('Esse material já está selecionado.');
    await page.getByLabel('Nome do material',{exact:true}).fill('');
    await page.getByRole('button',{name:'Remover material Material especial teste',exact:true}).click();
    await page.getByLabel('Nome do material',{exact:true}).fill('Manta de algodão');
    await page.getByRole('button',{name:'Adicionar',exact:true}).click();

    const layout = await page.evaluate(() => {
      const map = document.querySelector('.leaflet-container')!.parentElement!.getBoundingClientRect();
      const basic = document.querySelector('#ponto-nome')!.closest('[class*="formCard"]')!.getBoundingClientRect();
      const conditions = document.querySelector('.condicoes-ponto')!.getBoundingClientRect();
      const form = document.querySelector('form')!.getBoundingClientRect();
      return {map:{x:map.x,right:map.right,bottom:map.bottom},basic:{x:basic.x,bottom:basic.bottom},conditions:{x:conditions.x,y:conditions.y,width:conditions.width},form:{x:form.x,width:form.width},overflow:document.documentElement.scrollWidth>innerWidth};
    });
    expect(layout.overflow).toBeFalsy();
    expect(layout.conditions.y).toBeGreaterThanOrEqual(Math.max(layout.map.bottom,layout.basic.bottom));
    expect(Math.abs(layout.conditions.width-layout.form.width)).toBeLessThan(2);
    if(width>960) expect(layout.map.right).toBeLessThanOrEqual(layout.basic.x);
    await page.screenshot({path:info.outputPath('condicoes-'+width+'.png'),fullPage:true});
    await page.getByRole('button',{name:'Salvar alterações',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Dados Cadastrais da SEMA'})).toBeVisible();
    await page.reload(); await editar();
    await expect(page.getByRole('checkbox',{name:'Segunda',exact:true})).not.toBeChecked();
    await expect(page.getByLabel('Início do horário padrão',{exact:true})).toHaveValue('09:30');
    await expect(page.getByLabel('Fim do horário padrão',{exact:true})).toHaveValue('15:00');
    await expect(page.getByRole('checkbox',{name:'Apara de tecido',exact:true})).toBeChecked();
    await expect(page.getByRole('button',{name:'Remover material Manta de algodão',exact:true})).toBeVisible();
    const saved = (await (await request.get(api+'/pontos-coleta/admin',{headers})).json()).find((p:{id:string})=>p.id===point.id);
    expect(saved.horarios_semana).toEqual([{dia:2,inicio:'09:30',fim:'15:00'}]);
    expect(saved.materiais_lista).toEqual(['Retalho de corte','Apara de tecido','Manta de algodão']);
    await request.delete(api+'/pontos-coleta/'+point.id+'?tipo=soft',{headers});
  });
}

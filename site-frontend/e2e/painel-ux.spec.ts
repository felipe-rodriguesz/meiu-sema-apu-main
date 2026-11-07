import { test, expect } from '@playwright/test';
const panel = process.env.E2E_BASE_URL || 'http://localhost:8080/admin/';
if (!['localhost','127.0.0.1'].includes(new URL(panel).hostname)) throw new Error('Somente ambiente local.');
const pontos = [
  { id:'a',nome:'Ecoponto Centro',tipo:'Ponto Fixo',bairro:'Centro',endereco:'Rua de teste, 100',status:'ATIVO',lat:-23.55,lon:-51.46 },
  { id:'b',nome:'Ecoponto Norte',tipo:'Ponto Fixo',bairro:'Norte',endereco:'Rua de teste, 200',status:'INATIVO',lat:-23.55,lon:-51.46 }
];
const pedidos = [
  { id:'1',protocolo:'TX-EXEMPLO-PENDENTE',situacao:'PENDENTE',quantidade_kg:10,peso_recebido_kg:null,criado_em:'2026-10-30T12:00:00',residuo_principal:'Retalho de corte',material:'Algodão',ponto_coleta:pontos[0] },
  { id:'2',protocolo:'TX-EXEMPLO-RECEBIDO',situacao:'RECEBIDO',quantidade_kg:5,peso_recebido_kg:4.5,criado_em:'2026-10-30T13:00:00',residuo_principal:'Apara de tecido',material:'Poliéster',ponto_coleta:pontos[0] }
];
for (const width of [1440,768,320]) test('navegação, filtros, erros e layout do painel em '+width+'px', async ({page}, info) => {
  await page.setViewportSize({width,height:1000});
  const errors:string[] = []; page.on('pageerror',e => errors.push(e.message));
  await page.route('**/api/v1/auth/login',r => r.fulfill({json:{usuario:{nome:'Operador de teste',email:'teste@example.test'}}}));
  await page.route('**/api/v1/auth/me',r => r.fulfill({status:401,json:{message:'Unauthorized'}}));
  await page.route('**/api/v1/pontos-coleta/admin',r => r.fulfill({json:pontos}));
  await page.route('**/api/v1/descartes',r => r.fulfill({json:pedidos}));
  let failure = false, reportCalls = 0;
  await page.route('**/api/v1/relatorios*',r => {
    reportCalls++;
    return failure ? r.fulfill({status:503,json:{message:'Relatório temporariamente indisponível.'}}) : r.fulfill({json:{
      totais:{registros:2,pendentes:1,recebidos:1,peso_declarado_kg:15,peso_recebido_kg:4.5},
      por_ponto:[],por_residuo:[],registros:pedidos.map(p=>({...p,ponto_nome:p.ponto_coleta.nome,recebido_em:null}))
    }});
  });
  await page.goto(panel);
  await page.getByPlaceholder('admin@admin-sema.com').fill('teste@example.test');
  await page.locator('input[type=password]').fill('senha-teste');
  await page.getByRole('button',{name:'Entrar no Sistema'}).click();
  await expect(page.getByRole('heading',{name:'Condições de atendimento'})).toHaveText('Condições de atendimento');
  await expect(page.locator('.condicoes-etapa')).toHaveCount(0);
  await page.getByLabel('Buscar ponto',{exact:true}).fill('Norte');
  await expect(page.getByRole('region',{name:'Lista de pontos de coleta'}).getByRole('row')).toHaveCount(2);
  await page.getByRole('combobox',{name:'Situação do ponto',exact:true}).selectOption('ATIVO');
  await expect(page.getByText('Nenhum ponto corresponde aos filtros.')).toBeVisible();
  await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
  await expect(page.getByRole('region',{name:'Lista de pontos de coleta'}).getByRole('row')).toHaveCount(3);
  await page.getByLabel('Início do horário padrão',{exact:true}).fill('08:00');
  await page.getByLabel('Fim do horário padrão',{exact:true}).fill('17:00');
  for (const day of ['Segunda','Terça','Quarta','Quinta','Sexta']) await page.getByRole('checkbox',{name:day,exact:true}).check();
  await page.getByRole('button',{name:'Personalizar Sexta',exact:true}).click();
  await page.getByLabel('Fim de Sexta',{exact:true}).fill('12:00');
  await page.getByRole('checkbox',{name:'Retalho de corte',exact:true}).check();
  await page.screenshot({path:info.outputPath('pontos-'+width+'.png'),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBeFalsy();
  await page.getByRole('button',{name:'Pedidos de coleta',exact:true}).click();
  await page.getByLabel('Situação',{exact:true}).selectOption('PENDENTE');
  await expect(page.getByRole('region',{name:'Lista de pedidos'}).getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('region',{name:'Lista de pedidos'})).not.toContainText('TX-EXEMPLO-RECEBIDO');
  await page.getByLabel('Filtrar pedidos',{exact:true}).fill('inexistente');
  await expect(page.getByText('Nenhum pedido encontrado.')).toBeVisible();
  await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
  await expect(page.getByRole('region',{name:'Lista de pedidos'}).getByRole('row')).toHaveCount(3);
  await page.screenshot({path:info.outputPath('pedidos-'+width+'.png'),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBeFalsy();
  await page.getByRole('button',{name:'Relatórios',exact:true}).click();
  const exportar=page.getByRole('button',{name:'Exportar CSV dos filtros aplicados'});
  await expect(exportar).toBeEnabled();
  await page.getByLabel('De',{exact:true}).fill('2026-10-30');
  await page.getByLabel('Até',{exact:true}).fill('2026-10-01');
  const before=reportCalls;
  await page.getByRole('button',{name:'Aplicar filtros',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('A data final deve ser igual ou posterior à data inicial.');
  expect(reportCalls).toBe(before);
  await expect(exportar).toBeDisabled();
  failure=true;
  await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
  await expect(page.getByRole('alert')).toHaveText('Relatório temporariamente indisponível.');
  await expect(page.locator('.relatorio-totais')).toHaveCount(0);
  failure=false;
  await page.getByRole('button',{name:'Aplicar filtros',exact:true}).click();
  await expect(exportar).toBeEnabled();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.screenshot({path:info.outputPath('relatorios-'+width+'.png'),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBeFalsy();
  expect(errors).toEqual([]);
});

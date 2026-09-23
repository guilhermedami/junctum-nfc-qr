# LinkWise Pro

JUNCTUM — CRM + PROSPECÇÃO + GESTÃO E ANALYTICS DE PLACAS NFC/QR

Quero construir uma aplicação SaaS web completa chamada JUNCTUM.

IMPORTANTE: não quero apenas um protótipo visual. Quero uma aplicação funcional, com frontend, banco de dados, autenticação, regras de acesso e persistência real de dados.

Utilize Supabase como backend sempre que necessário, incluindo PostgreSQL, autenticação, Row Level Security e Edge Functions.

Antes de implementar integrações que dependam de serviços pagos ou APIs externas, crie a estrutura preparada para elas e informe o que precisa ser configurado. Não invente resultados de APIs.

1. OBJETIVO DO SISTEMA

A JUNCTUM vende soluções físicas e digitais para empresas, principalmente placas com NFC e QR Code.

Essas placas podem direcionar consumidores para:

Google Avaliações;

WhatsApp;

Instagram;

cardápio;

site;

redes sociais;

links personalizados.

A aplicação deverá controlar TODO o ciclo comercial:

PROSPECÇÃO
→ LEAD
→ VISITA
→ FOLLOW-UP
→ PROPOSTA
→ VENDA
→ CLIENTE
→ PLACA
→ ATIVAÇÃO
→ ACESSOS NFC/QR
→ ANALYTICS
→ RELATÓRIO
→ PÓS-VENDA.

O grande diferencial da plataforma será conseguir acompanhar cada placa vendida e mostrar quantas interações foram realizadas através de NFC e QR Code separadamente.

2. DESIGN

Quero um sistema profissional, minimalista e tecnológico.

Marca: JUNCTUM

Visual:

SaaS premium;

corporativo;

moderno;

clean;

bastante espaço em branco;

excelente legibilidade;

gráficos profissionais;

cards elegantes;

microinterações discretas.

Paleta:

grafite quase preto;

branco;

cinza frio;

azul elétrico usado apenas como destaque.

Não utilizar visual infantil, gradientes exagerados ou excesso de elementos.

Desktop com sidebar.

Mobile com navegação adaptada.

A aplicação deverá ser mobile-first, pois vendedores utilizarão o sistema durante visitas presenciais.

3. AUTENTICAÇÃO

Criar autenticação com Supabase Auth.

Perfis:

ADMIN

Controle total.

VENDEDOR

Visualiza e administra apenas leads/oportunidades atribuídos a ele, conforme regras definidas.

CLIENTE

Futuramente terá acesso apenas às próprias empresas, placas e analytics.

Criar estrutura de profiles relacionada a auth.users.

Implementar segurança utilizando Row Level Security no Supabase.

Não depender apenas de esconder elementos da interface.

4. DASHBOARD

Criar dashboard utilizando dados REAIS do banco.

Não utilizar números fictícios em produção.

Quando não existirem dados, mostrar:

0

ou estado vazio apropriado.

Cards:

PROSPECÇÃO

Leads

Leads novos

Contatados

Interessados

Propostas abertas

VENDAS

Vendas no mês

Faturamento

Ticket médio

Taxa de conversão

CLIENTES

Clientes ativos

Novos clientes

PLACAS

Total

Em produção

Ativas

Inativas

INTERAÇÕES

Interações hoje

7 dias

30 dias

Mês atual

Total histórico

Separar:

NFC

QR CODE

Criar gráfico:

Interações nos últimos 30 dias

e gráfico:

NFC × QR Code

Filtros:

7 dias

30 dias

90 dias

Personalizado.

5. PROSPECÇÃO

Criar módulo:

Prospecção

Quero encontrar e cadastrar potenciais empresas.

Inicialmente permitir:

cadastro manual;

importação CSV.

Preparar arquitetura para posteriormente integrar uma API legítima de busca de empresas/dados empresariais.

Filtros:

Estado

Cidade

Bairro

Segmento

Categoria

Nome

Telefone

WhatsApp

Instagram

Site

Google

Status

Campos:

nome_empresa

nome_fantasia

cnpj

segmento

categoria

responsavel

telefone

whatsapp

email

instagram

site

google_url

endereco

bairro

cidade

estado

cep

origem

observacoes

vendedor

created_at

Criar:

Adicionar ao CRM

IMPORTANTE:

Não faça scraping ilegal ou dependente de métodos frágeis.

Não invente empresas.

Caso nenhuma API esteja configurada, mantenha cadastro/importação funcionando normalmente.

6. CRM

Criar CRM Kanban.

Etapas iniciais:

NOVO LEAD

PARA VISITAR

VISITADO

CONTATADO

INTERESSADO

FOLLOW-UP

PROPOSTA ENVIADA

NEGOCIAÇÃO

VENDA FECHADA

NÃO FECHOU

Cards arrastáveis por drag-and-drop.

Permitir administrador:

criar etapa;

renomear;

reordenar;

arquivar.

Card:

Empresa

Responsável

Telefone

Valor estimado

Último contato

Próxima ação

Vendedor

Tempo na etapa.

Toda alteração de etapa deverá gerar automaticamente um registro no histórico.

7. PERFIL DO LEAD

Criar página individual.

Mostrar:

dados;

observações;

oportunidade;

tarefas;

histórico;

mensagens;

propostas.

Timeline:

21/09 — Lead criado

22/09 — Visita realizada

23/09 — WhatsApp

25/09 — Proposta

28/09 — Venda

Criar ações rápidas:

LIGAR

WHATSAPP

MAPA

REGISTRAR VISITA

FOLLOW-UP

PROPOSTA

FECHAR VENDA.

8. FOLLOW-UP

Criar tarefas relacionadas aos leads.

Tipos:

Ligação

WhatsApp

Visita

Proposta

Reunião

Retorno

Outro

Campos:

data

horário

responsável

prioridade

observação

status.

Dashboard deverá mostrar:

FOLLOW-UPS DE HOJE

FOLLOW-UPS ATRASADOS.

9. MENSAGENS

Criar biblioteca de mensagens comerciais.

Categorias:

Primeiro contato

Pós-visita

Follow-up

Proposta

Fechamento

Pós-venda

Renovação

Variáveis:

{{nome}}

{{empresa}}

{{cidade}}

{{vendedor}}

{{produto}}

{{valor}}

Botão:

Enviar pelo WhatsApp

Utilizar URL oficial de abertura do WhatsApp com telefone + mensagem pré-preenchida.

10. METAS

Criar metas:

diárias;

semanais;

mensais;

personalizadas.

Métricas:

Prospecções

Visitas

Contatos

Follow-ups

Propostas

Vendas

Faturamento

Novos clientes.

Mostrar:

META

REALIZADO

FALTANTE

%

e barra de progresso.

Os valores devem ser calculados usando dados reais.

11. VENDA → CLIENTE

Quando oportunidade for marcada como:

VENDA FECHADA

mostrar:

Converter em cliente

Cadastrar:

empresa

responsável

CNPJ

telefone

WhatsApp

email

Instagram

site

Google

endereço

plano

data início

vendedor

observações.

Status:

ATIVO

INATIVO

CANCELADO.

12. MÓDULO PRINCIPAL — PLACAS

Este é um dos recursos MAIS IMPORTANTES.

Criar menu:

PLACAS

Cada placa física possui registro individual.

Campos:

id

public_id / slug aleatório e não previsível

codigo_interno

cliente_id

empresa_id

nome

tipo

data_venda

data_ativacao

status

destination_url

nfc_tracking_url

qr_tracking_url

created_at

updated_at.

Status:

PRODUÇÃO

AGUARDANDO ENTREGA

ENTREGUE

ATIVA

PAUSADA

INATIVA

SUBSTITUÍDA.

13. TIPOS DE PLACA

Criar tipos:

Google Avaliações

WhatsApp

Instagram

Cardápio

Site

Wi-Fi

Link personalizado

Outro.

Administrador pode criar outros.

14. TRACKING REAL — MUITO IMPORTANTE

NFC e QR NÃO devem apontar diretamente para Google, WhatsApp ou Instagram.

Precisamos de URLs intermediárias permanentes da JUNCTUM.

Exemplo conceitual:

https://dominio.com/r/{slug}/nfc

https://dominio.com/r/{slug}/qr

A tag NFC utilizará a URL NFC.

O QR Code utilizará a URL QR.

Quando uma pessoa acessar:

validar que a placa existe;

identificar origem NFC ou QR;

verificar status;

registrar evento no banco;

redirecionar imediatamente para destination_url.

Se placa estiver pausada/inativa, mostrar página neutra em vez do destino.

Criar esta lógica no backend/server-side ou Edge Function.

NÃO confiar em JavaScript do navegador para registrar o evento antes do redirecionamento.

O tracking precisa funcionar mesmo quando o usuário simplesmente aproxima o celular do NFC e abre o link.

15. DIFERENCIAR NFC E QR

Isso é obrigatório.

Uma placa terá:

URL NFC:
/r/{slug}/nfc

URL QR:
/r/{slug}/qr

Ambos podem levar ao MESMO destino final.

Mas cada acesso deverá registrar:

source = nfc

ou

source = qr.

Assim conseguiremos apresentar:

TOTAL: 1.284

NFC: 824

QR: 460.

16. QR CODE

Para cada placa gerar automaticamente QR Code correspondente à URL rastreável QR.

Permitir:

visualizar;

baixar PNG;

baixar SVG, se possível;

copiar URL;

testar URL.

IMPORTANTE:

O QR impresso deverá utilizar o link intermediário permanente da JUNCTUM e nunca diretamente a URL final.

17. DESTINO EDITÁVEL

Quero poder alterar o destino da placa SEM trocar:

NFC físico;

QR impresso;

link rastreável.

Exemplo:

Hoje:

Placa → Google Avaliações A.

Administrador altera destination_url.

Amanhã:

mesma placa física → Google Avaliações B.

Registrar histórico:

URL anterior

URL nova

data

usuário responsável.

Não apagar analytics anteriores.

18. ACCESS_EVENTS

Criar tabela específica para analytics.

Campos mínimos:

id

plate_id

client_id

source

created_at

destination_url_snapshot

user_agent quando disponível.

Opcionalmente e apenas quando apropriado:

device_type

browser

os.

Evitar armazenar dados pessoais desnecessários.

Preparar o sistema considerando LGPD.

19. INTERAÇÕES X PESSOAS

IMPORTANTE:

Nunca apresentar número bruto de acessos como se necessariamente representasse número de pessoas.

Usar nomenclatura:

INTERAÇÕES

ou

ACESSOS

Exemplo:

683 interações.

Não:

683 pessoas.

Preparar arquitetura para futuramente calcular visitantes únicos/estimados separadamente, caso seja implementado método tecnicamente adequado e compatível com privacidade.

20. ANALYTICS DA PLACA

Página individual da placa.

Mostrar:

TOTAL DE INTERAÇÕES

NFC

QR

HOJE

7 DIAS

30 DIAS

MÊS ATUAL

MÊS ANTERIOR

TOTAL HISTÓRICO.

Gráfico diário.

Comparativo:

NFC × QR.

Mostrar:

dia de maior utilização;

faixa horária mais ativa;

média diária;

variação percentual versus período anterior.

Permitir escolher período personalizado.

21. ANALYTICS DO CLIENTE

Um cliente pode ter várias placas.

Exemplo:

RESTAURANTE BELLA

Google — Balcão

Google — Caixa

Instagram — Mesa

WhatsApp — Recepção.

Dashboard do cliente:

Total de placas

Placas ativas

Total de interações

NFC

QR

Interações no mês

Mês anterior

Placa mais utilizada.

Filtros:

todas as placas;

uma placa;

período.

22. GOOGLE AVALIAÇÕES

Criar no cadastro do cliente campos:

google_business_url

google_review_url

reviews_at_start

reviews_current

reviews_last_updated_at.

Quero registrar quantas avaliações o estabelecimento possuía quando começou a utilizar a JUNCTUM.

Exemplo:

Instalação:

428 avaliações.

Hoje:

501 avaliações.

Resultado:

+73 avaliações.

IMPORTANTE:

Não afirmar que todas as novas avaliações foram causadas pela placa.

Apresentar separadamente:

Interações na placa: 487

Novas avaliações observadas no período: +73

Não criar causalidade que não possa ser comprovada.

Inicialmente permitir atualização manual da quantidade de avaliações.

Preparar arquitetura para futura integração oficial/API quando disponível.

23. RELATÓRIO DO CLIENTE

Criar relatório profissional.

Cabeçalho:

JUNCTUM

Cliente

Período.

Indicadores:

Total de interações

NFC

QR

Variação do período

Avaliações no início

Avaliações atuais

Novas avaliações observadas

Gráfico diário

Placas com mais interações.

Criar botão:

Gerar relatório

e:

Compartilhar

Preparar para exportação PDF.

24. PORTAL DO CLIENTE

Criar estrutura do portal.

CLIENTE entra com login.

Visualiza APENAS:

seus dados;

suas placas;

seus analytics;

seus relatórios.

Dashboard:

Resultados das suas placas

Hoje

Este mês

NFC

QR

Total

Gráfico

Minhas placas.

Cliente NÃO pode acessar:

CRM;

outros clientes;

leads;

faturamento JUNCTUM;

metas internas;

dados comerciais internos.

Implementar isso usando RLS.

25. BANCO DE DADOS

Planeje corretamente o schema antes de implementar.

Entidades mínimas:

profiles

companies

leads

pipeline_stages

opportunities

activities

followups

message_templates

goals

sales

clients

plate_types

plates

tracking_links

access_events

destination_history

review_snapshots

reports

notifications.

Utilizar UUIDs internamente.

Para URLs públicas utilizar identificadores aleatórios e não enumeráveis.

Criar índices principalmente em:

access_events.plate_id

access_events.created_at

plates.client_id

leads.owner_id

opportunities.stage_id.

26. SEGURANÇA

Implementar RLS.

ADMIN:
acesso administrativo.

VENDEDOR:
somente dados comerciais permitidos.

CLIENTE:
somente dados vinculados à própria conta.

Não utilizar IDs sequenciais nas URLs públicas de tracking.

Validar URLs de destino.

Proteger rotas administrativas.

Não colocar service-role keys no frontend.

Registrar ações administrativas críticas.

27. PERFORMANCE DO TRACKING

A rota NFC/QR será muito acessada.

Ela precisa ser extremamente rápida.

Fluxo:

REQUISIÇÃO
→ localizar placa
→ registrar evento
→ REDIRECT HTTP.

Não carregar dashboard ou React antes do redirecionamento.

Priorizar execução server-side/Edge Function.

28. BUSCA GLOBAL

Permitir buscar:

empresa;

lead;

cliente;

telefone;

CNPJ;

placa;

código.

29. NOTIFICAÇÕES

Exemplos:

8 follow-ups hoje.

3 atrasados.

Nova venda.

Placa aguardando ativação.

Meta chegou a 80%.

30. MOBILE

No celular criar botão de ação rápida:

LEAD

VISITA

FOLLOW-UP

VENDA

CLIENTE

PLACA.

Lead:

Ligar

WhatsApp

Mapa

Visita

Follow-up

Venda.

31. NÃO IMPLEMENTAR AGORA

Não quero que a primeira versão fique enorme ou instável.

Deixar preparado, mas NÃO priorizar agora:

cobrança recorrente;

Stripe;

comissões complexas;

white label;

automação oficial de WhatsApp;

IA;

múltiplas filiais;

integrações pagas.

32. ORDEM DE IMPLEMENTAÇÃO

Não tente construir tudo superficialmente ao mesmo tempo.

FASE 1:
Supabase + autenticação + profiles + RLS + banco.

FASE 2:
Dashboard + leads + CRM + follow-ups.

FASE 3:
Vendas + clientes.

FASE 4:
Placas.

FASE 5:
URLs rastreáveis NFC/QR + access_events + redirect.

FASE 6:
Analytics.

FASE 7:
Google Reviews manual + relatórios.

FASE 8:
Portal do cliente.

Comece implementando as FASES 1 A 4 com estrutura sólida.

Depois apresente o que foi criado e informe quais migrations/tabelas/RLS foram implementadas antes de avançar para o tracking.

33. REGRA FUNDAMENTAL

Não simule funcionalidades que deveriam ser reais.

Se alguma função depender de:

API externa;

chave;

domínio;

configuração Supabase;

serviço externo;

plano pago;

informe claramente.

Nunca substitua uma integração ausente por dados falsos sem identificá-los.

RESULTADO ESPERADO

Quero que a JUNCTUM seja simultaneamente:

CRM de prospecção

Sistema comercial

Gestão de clientes

Gestão das placas NFC/QR

Plataforma de analytics

Portal de resultados para os clientes.

O objetivo final é transformar a venda de uma placa física em um serviço tecnológico mensurável e potencialmente recorrente.

Comece pelas Fases 1 a 4 e mantenha a arquitetura preparada para as demais.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d3ae0bc2-b68f-40b0-8331-21eaf987a8e5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

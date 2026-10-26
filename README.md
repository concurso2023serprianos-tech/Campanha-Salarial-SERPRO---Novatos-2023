# Portal da Campanha Salarial dos Empregados do SERPRO

Site estático, sem framework e sem build, criado para ser o **ponto central de informação e mobilização** da campanha salarial (ACT), puxada pela turma do concurso de 2023.

Todo o conteúdo fica em arquivos **JSON** dentro de `content/`. Quem edita não precisa saber HTML, CSS ou JavaScript.

---

## 1. Estrutura

```
site/
├── index.html            Início
├── pauta.html            Pauta da campanha (7 eixos)
├── direitos.html         O que os novatos perderam
├── estudo.html           Estudo reajustes x inflação
├── assembleias.html      Agenda de assembleias e negociações
├── informes.html         Boletins da campanha
├── links.html            Grupos, entidades e documentos
├── faq.html              Dúvidas frequentes
├── participe.html        Cadastro de e-mail e contatos
│
├── content/              👈 AQUI SE EDITA O CONTEÚDO
│   ├── site.json         Nome, cores, menu, contatos, formulário, rodapé
│   ├── home.json
│   ├── pauta.json
│   ├── direitos.json
│   ├── estudo.json
│   ├── agenda.json
│   ├── informes.json
│   ├── links.json
│   ├── faq.json
│   └── participe.json
│
├── assets/
│   ├── css/style.css     Aparência
│   ├── js/app.js         Motor que lê os JSON e monta as páginas
│   └── img/              Gráficos do estudo + favicon
│
├── dados/                CSVs do estudo (fonte aberta para conferência)
└── .github/workflows/deploy.yml   Publicação automática no GitHub Pages
```

---

## 2. Rodar localmente

O site lê arquivos JSON via `fetch`, o que não funciona abrindo o HTML direto do disco. Suba um servidor local:

```bash
cd site
python3 -m http.server 8000
```

Acesse <http://localhost:8000>. Salvou um JSON? Basta recarregar a página (F5).

---

## 3. Como editar o conteúdo

Cada página é uma lista de **blocos**. Um bloco é um objeto JSON com um campo `tipo`.
Para adicionar uma seção, copie um bloco existente, cole e edite o texto.

### Tipos de bloco disponíveis

| `tipo` | Para que serve | Campos principais |
|---|---|---|
| `hero` | Cabeçalho grande da página | `chapeu`, `titulo`, `texto`, `acoes[]` |
| `stats` | Grade de números-chave | `itens[]` com `valor`, `rotulo`, `destaque` |
| `cards` | Grade de cartões (clicáveis se tiverem `href`) | `itens[]` com `icone`, `titulo`, `texto`, `href`, `cta` |
| `richtext` | Texto corrido com bullets e links | `paragrafos[]`, `bullets[]`, `links[]` |
| `table` | Tabela | `colunas[]`, `alinhamento[]`, `linhas[]` |
| `accordion` | Itens expansíveis (usado na pauta e no FAQ) | `itens[]` com `numero`, `titulo`, `paragrafos[]`, `reivindicacoes[]`, `frase` |
| `galeria` | Grade de imagens com legenda | `itens[]` com `arquivo`, `titulo`, `legenda` |
| `agenda` | Calendário de eventos | `itens[]` com `data` (AAAA-MM-DD), `hora`, `local`, `tipo` |
| `informes` | Lista de boletins, do mais novo ao mais antigo | `itens[]` com `data`, `titulo`, `resumo`, `corpo[]`, `tags[]` |
| `linkgroups` | Blocos de links agrupados por tema | `grupos[]` com `titulo`, `links[]` |
| `aviso` | Caixa de destaque (`estilo`: `info` ou `atencao`) | `titulo`, `texto` |
| `cta` | Faixa verde de chamada para ação | `titulo`, `texto`, `acoes[]`, `compartilhar` |
| `form` | Formulário de cadastro (configurado em `site.json`) | `titulo`, `descricao` |
| `contatos` | Lista de contatos definida em `site.json` | `titulo` |

### Formatação dentro dos textos

Funciona em qualquer campo de texto:

- `**negrito**`
- `*itálico*`
- `` `código` ``
- `[texto do link](https://exemplo.org)`

### Exemplos rápidos

**Publicar um informe novo** — em `content/informes.json`, adicione no topo de `itens`:

```json
{
  "data": "2026-10-16",
  "titulo": "Pauta aprovada em assembleia",
  "resumo": "Os sete eixos foram aprovados com duas emendas.",
  "tags": ["assembleia", "pauta"],
  "corpo": ["Texto completo do informe..."],
  "link": { "texto": "Ver a pauta final", "href": "pauta.html" }
}
```

**Marcar uma assembleia** — em `content/agenda.json`, adicione em `itens`:

```json
{
  "data": "2026-11-12",
  "hora": "18h00",
  "titulo": "Assembleia de avaliação da proposta",
  "local": "Online",
  "descricao": "Votação da proposta apresentada pela empresa.",
  "tipo": "assembleia"
}
```

Eventos com data passada migram sozinhos para a seção "Já aconteceu".

**Mudar a tarja amarela do topo** — em `content/site.json`, bloco `avisoTopo`. Para desligar, mude `"ativo"` para `false`.

**Mudar as cores** — em `content/site.json`, bloco `tema`.

---

## 4. Configurar o cadastro de e-mail

Em `content/site.json`, bloco `cadastro`. Três opções:

### Opção A — Google Forms (recomendada, sem servidor)
1. Crie um formulário no Google Forms com os campos: nome, e-mail, unidade, ano de ingresso, mensagem, consentimento.
2. Em **Enviar → `< >`** copie a URL do `iframe` e cole em `googleFormsEmbedUrl`.
3. Em **Enviar → link**, copie o link curto e cole em `googleFormsLinkDireto`.
4. Deixe `"provedor": "googleforms"`.

As respostas caem direto numa planilha do Google.

### Opção B — Formspree
1. Crie um formulário grátis em <https://formspree.io>.
2. Cole o endpoint em `formspreeEndpoint`.
3. Mude `"provedor"` para `"formspree"`.

### Opção C — mailto (sem nenhum cadastro)
Mude `"provedor"` para `"mailto"` e ajuste `emailContato`. O envio abre o cliente de e-mail do usuário.

> **LGPD:** mantenha o texto de `politicaDados`, colete apenas o necessário e atenda pedidos de remoção. Não publique lista de e-mails em lugar nenhum.

---

## 5. Publicar

### GitHub Pages (grátis, com deploy automático)

```bash
cd site
git init
git add .
git commit -m "Portal da campanha salarial SERPRO"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/campanha-serpro.git
git push -u origin main
```

No repositório: **Settings → Pages → Source: GitHub Actions**.
O workflow `.github/workflows/deploy.yml` publica a cada `push` na `main`.
Depois, atualize o campo `url` em `content/site.json`.

Para domínio próprio (ex.: `campanhaserpro.org`), crie um arquivo `CNAME` na raiz com o domínio e aponte o DNS para o GitHub Pages.

### Alternativas em um clique
- **Netlify** ou **Cloudflare Pages**: arraste a pasta `site/` na interface. Sem build, publish directory = raiz.
- **Vercel**: importe o repositório, framework preset = *Other*.

---

## 6. Checklist antes de divulgar

- [ ] Substituir todos os `SEU_...` em `content/site.json` e `content/links.json` (WhatsApp, Telegram, Instagram, e-mail, formulário).
- [ ] Confirmar a **fonte de cada linha** da tabela em `content/direitos.json` (cláusula + ACT + ano) e remover o `"verificar": true` dos itens confirmados.
- [ ] Ajustar as datas reais em `content/agenda.json` — as atuais são exemplos.
- [ ] Validar com as entidades sindicais o que é pauta oficial e o que é proposta em construção.
- [ ] Conferir se o aviso de "não é canal oficial" (rodapé) está visível.
- [ ] Testar o formulário de cadastro de ponta a ponta.
- [ ] Testar no celular — a maior parte do acesso virá de lá.

---

## 7. Origem dos dados do estudo

- **Reajustes:** cláusulas de correção salarial dos ACTs publicados no [Portal da Transparência do SERPRO](https://www.transparencia.serpro.gov.br/acesso-a-informacao/servidores/acordo-coletivo-de-trabalho-act).
- **Inflação:** séries IBGE/SNIPC (IPCA geral, grupo Alimentação e Bebidas, Alimentação no Domicílio) via IPEA Data.
- **Remuneração da diretoria:** Portal da Transparência do SERPRO.
- Planilhas em `dados/`, gráficos em `assets/img/`, metodologia resumida na página do estudo.

Quando o estudo for atualizado na pasta `outputs/` do projeto, basta recopiar:

```bash
cp ../outputs/figs/*.png assets/img/
cp ../outputs/*.csv dados/
```

e revisar os números em `content/estudo.json` e `content/home.json`.

/**
 * Motor do site da Campanha Salarial SERPRO.
 * Lê JSON de /content e monta a página. Nenhuma dependência externa.
 * Para adicionar conteúdo, edite os arquivos em content/ — não é preciso mexer aqui.
 */

const App = (() => {
  'use strict';

  const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  /* ----------------------------- utilidades ----------------------------- */

  const escapar = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Escapa primeiro e só então aplica marcação leve: **negrito**, *itálico*, `código`, [texto](url)
  const fmt = (s) => escapar(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|[\w./#?=&-]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  const el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  const attrId = (b) => (b.id ? ` id="${escapar(b.id)}"` : '');

  const carregar = async (arquivo) => {
    const r = await fetch(`content/${arquivo}?v=${Date.now()}`);
    if (!r.ok) throw new Error(`Não foi possível carregar content/${arquivo} (HTTP ${r.status})`);
    return r.json();
  };

  /* ------------------------------ renderers ----------------------------- */

  const botoes = (acoes = []) => acoes.length
    ? `<div class="acoes">${acoes.map((a) =>
        `<a class="btn ${a.estilo === 'secundario' ? 'secundario' : 'primario'}" href="${escapar(a.href)}">${fmt(a.texto)}</a>`
      ).join('')}</div>`
    : '';

  const cabecalhoBloco = (b) => `
    ${b.titulo ? `<h2>${fmt(b.titulo)}</h2>` : ''}
    ${b.descricao ? `<p class="descricao">${fmt(b.descricao)}</p>` : ''}`;

  const rodapeBloco = (b) => (b.rodape ? `<p class="rodapeBloco">${fmt(b.rodape)}</p>` : '');

  const barraCompartilhar = () => `
    <div class="compartilharBar">
      <button type="button" data-acao="copiar-link">🔗 Copiar link</button>
      <a data-acao="whatsapp" href="#" target="_blank" rel="noopener">💬 WhatsApp</a>
      <a data-acao="telegram" href="#" target="_blank" rel="noopener">📣 Telegram</a>
      <button type="button" data-acao="imprimir">🖨️ Imprimir / PDF</button>
    </div>`;

  const renderers = {
    hero: (b) => `
      <section class="hero"${attrId(b)}>
        <div class="container">
          ${b.chapeu ? `<span class="chapeu">${fmt(b.chapeu)}</span>` : ''}
          <h1>${fmt(b.titulo)}</h1>
          ${b.texto ? `<p>${fmt(b.texto)}</p>` : ''}
          ${botoes(b.acoes)}
        </div>
      </section>`,

    stats: (b) => `
      <section class="bloco"${attrId(b)}><div class="container">
        ${cabecalhoBloco(b)}
        <div class="stats">${(b.itens || []).map((i) => `
          <div class="stat${i.destaque ? ' destaque' : ''}">
            <div class="valor">${fmt(i.valor)}</div>
            <div class="rotulo">${fmt(i.rotulo)}</div>
          </div>`).join('')}</div>
        ${rodapeBloco(b)}
      </div></section>`,

    cards: (b) => `
      <section class="bloco"${attrId(b)}><div class="container">
        ${cabecalhoBloco(b)}
        <div class="cards">${(b.itens || []).map((i) => {
          const corpo = `
            ${i.icone ? `<div class="icone">${fmt(i.icone)}</div>` : ''}
            <h3>${fmt(i.titulo)}</h3>
            <p>${fmt(i.texto)}</p>
            ${i.cta ? `<span class="cardCta">${fmt(i.cta)} →</span>` : ''}`;
          return i.href
            ? `<a class="card" href="${escapar(i.href)}">${corpo}</a>`
            : `<div class="card">${corpo}</div>`;
        }).join('')}</div>
        ${rodapeBloco(b)}
      </div></section>`,

    richtext: (b) => `
      <section class="bloco"${attrId(b)}><div class="container richtext">
        ${cabecalhoBloco(b)}
        ${(b.paragrafos || []).map((p) => `<p>${fmt(p)}</p>`).join('')}
        ${b.bullets ? `<ul>${b.bullets.map((x) => `<li>${fmt(x)}</li>`).join('')}</ul>` : ''}
        ${b.links ? `<ul class="linksLista">${b.links.map((l) =>
          `<li>🔗 <a href="${escapar(l.href)}" target="_blank" rel="noopener">${fmt(l.texto)}</a></li>`).join('')}</ul>` : ''}
        ${rodapeBloco(b)}
      </div></section>`,

    table: (b) => {
      const al = b.alinhamento || [];
      const estilo = (i) => (al[i] ? ` style="text-align:${escapar(al[i])}"` : '');
      return `
      <section class="bloco"${attrId(b)}><div class="container">
        ${cabecalhoBloco(b)}
        <div class="tabelaWrap"><table>
          <thead><tr>${(b.colunas || []).map((c, i) => `<th${estilo(i)}>${fmt(c)}</th>`).join('')}</tr></thead>
          <tbody>${(b.linhas || []).map((l) => `
            <tr class="${l.destaque ? 'destaque' : ''}">${l.celulas.map((c, i) =>
              `<td${estilo(i)}>${fmt(c)}${l.verificar && i === l.celulas.length - 1 ? '<span class="selo">a confirmar</span>' : ''}</td>`
            ).join('')}</tr>`).join('')}</tbody>
        </table></div>
        ${rodapeBloco(b)}
      </div></section>`;
    },

    accordion: (b) => `
      <section class="bloco"${attrId(b)}><div class="container">
        ${cabecalhoBloco(b)}
        <div class="acc">${(b.itens || []).map((i, idx) => `
          <details${b.abrirPrimeiro && idx === 0 ? ' open' : ''}>
            <summary>
              ${i.numero ? `<span class="numero">${fmt(i.numero)}</span>` : ''}
              <span>${fmt(i.titulo)}</span>
            </summary>
            <div class="conteudo">
              ${(i.paragrafos || []).map((p) => `<p>${fmt(p)}</p>`).join('')}
              ${i.reivindicacoes ? `<ul class="reivindicacoes">${i.reivindicacoes.map((r) => `<li>${fmt(r)}</li>`).join('')}</ul>` : ''}
              ${i.frase ? `<p class="frase">${fmt(i.frase)}</p>` : ''}
              ${i.link ? `<p><a href="${escapar(i.link.href)}">${fmt(i.link.texto)} →</a></p>` : ''}
            </div>
          </details>`).join('')}</div>
        ${rodapeBloco(b)}
      </div></section>`,

    galeria: (b) => `
      <section class="bloco"${attrId(b)}><div class="container">
        ${cabecalhoBloco(b)}
        <div class="galeria">${(b.itens || []).map((i) => `
          <figure class="figura">
            <img src="assets/img/${escapar(i.arquivo)}" alt="${escapar(i.titulo)}" loading="lazy">
            <figcaption><strong>${fmt(i.titulo)}</strong><span>${fmt(i.legenda || '')}</span></figcaption>
          </figure>`).join('')}</div>
        ${rodapeBloco(b)}
      </div></section>`,

    agenda: (b) => {
      const hoje = new Date().toISOString().slice(0, 10);
      const itens = [...(b.itens || [])].sort((x, y) => x.data.localeCompare(y.data));
      const futuros = itens.filter((i) => i.data >= hoje);
      const passados = itens.filter((i) => i.data < hoje).reverse();

      const evento = (i, passado) => {
        const [a, m, d] = i.data.split('-');
        return `
        <article class="evento${passado ? ' passado' : ''}">
          <div class="dataBox">
            <div class="dia">${escapar(d)}</div>
            <div class="mes">${MESES[Number(m) - 1] || ''}</div>
            <div class="ano">${escapar(a)}</div>
          </div>
          <div>
            ${i.tipo ? `<span class="tag ${escapar(i.tipo)}">${fmt(i.tipo)}</span>` : ''}
            <h3>${fmt(i.titulo)}</h3>
            <div class="meta">${i.hora ? `🕒 ${fmt(i.hora)} · ` : ''}${i.local ? `📍 ${fmt(i.local)}` : ''}</div>
            ${i.descricao ? `<p>${fmt(i.descricao)}</p>` : ''}
            ${i.link ? `<a href="${escapar(i.link.href)}">${fmt(i.link.texto)} →</a>` : ''}
          </div>
        </article>`;
      };

      return `
      <section class="bloco"${attrId(b)}><div class="container">
        ${cabecalhoBloco(b)}
        <div class="agendaLista">${futuros.length
          ? futuros.map((i) => evento(i, false)).join('')
          : '<p class="descricao">Nenhum evento futuro agendado no momento. Cadastre seu e-mail para ser avisado.</p>'}</div>
        ${passados.length ? `<div class="subtituloLista">Já aconteceu</div>
          <div class="agendaLista">${passados.map((i) => evento(i, true)).join('')}</div>` : ''}
        ${rodapeBloco(b)}
      </div></section>`;
    },

    informes: (b) => {
      const itens = [...(b.itens || [])].sort((x, y) => y.data.localeCompare(x.data));
      return `
      <section class="bloco"${attrId(b)}><div class="container">
        ${cabecalhoBloco(b)}
        <div class="informes">${itens.map((i) => `
          <article class="informe">
            <div class="dataInforme">${escapar(i.data.split('-').reverse().join('/'))}
              ${(i.tags || []).map((t) => `<span class="tag">${fmt(t)}</span>`).join('')}</div>
            <h3>${fmt(i.titulo)}</h3>
            <p class="resumo">${fmt(i.resumo)}</p>
            <div class="corpo">${(i.corpo || []).map((p) => `<p>${fmt(p)}</p>`).join('')}</div>
            ${i.link ? `<a href="${escapar(i.link.href)}">${fmt(i.link.texto)} →</a>` : ''}
          </article>`).join('')}</div>
        ${rodapeBloco(b)}
      </div></section>`;
    },

    linkgroups: (b) => `
      <section class="bloco"${attrId(b)}><div class="container">
        ${cabecalhoBloco(b)}
        <div class="linkgroups">${(b.grupos || []).map((g) => `
          <div class="linkgroup">
            <h3>${fmt(g.titulo)}</h3>
            ${g.descricao ? `<p>${fmt(g.descricao)}</p>` : ''}
            <ul>${(g.links || []).map((l) => `
              <li>
                <a href="${escapar(l.href)}"${/^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : ''}>${fmt(l.texto)}</a>
                ${l.detalhe ? `<span>${fmt(l.detalhe)}</span>` : ''}
              </li>`).join('')}</ul>
          </div>`).join('')}</div>
        ${rodapeBloco(b)}
      </div></section>`,

    aviso: (b) => `
      <section class="bloco"${attrId(b)}><div class="container">
        <div class="avisoBox ${escapar(b.estilo || 'info')}">
          ${b.titulo ? `<h3>${fmt(b.titulo)}</h3>` : ''}
          <p>${fmt(b.texto)}</p>
        </div>
      </div></section>`,

    cta: (b) => `
      <section class="bloco"${attrId(b)}><div class="container">
        <div class="ctaBox">
          <h2>${fmt(b.titulo)}</h2>
          ${b.texto ? `<p>${fmt(b.texto)}</p>` : ''}
          ${botoes(b.acoes)}
          ${b.compartilhar ? barraCompartilhar() : ''}
        </div>
      </div></section>`,

    contatos: (b, cfg) => `
      <section class="bloco"${attrId(b)}><div class="container">
        ${cabecalhoBloco(b)}
        <div class="contatos">${(cfg.contatos || []).map((c) => `
          <a class="contato" href="${escapar(c.href)}"${/^https?:/.test(c.href) ? ' target="_blank" rel="noopener"' : ''}>
            <span class="icone">${fmt(c.icone || '🔗')}</span>
            <span><span class="rotulo">${fmt(c.rotulo)}</span><span class="valor">${fmt(c.valor)}</span></span>
          </a>`).join('')}</div>
      </div></section>`,

    form: (b, cfg) => {
      const c = cfg.cadastro || {};
      let corpo;

      if (c.provedor === 'googleforms') {
        corpo = `
          <iframe src="${escapar(c.googleFormsEmbedUrl)}" loading="lazy" title="Formulário de cadastro">Carregando…</iframe>
          <p class="rodapeBloco">Se o formulário não carregar,
            <a href="${escapar(c.googleFormsLinkDireto)}" target="_blank" rel="noopener">abra em uma nova aba</a>.</p>`;
      } else {
        const action = c.provedor === 'formspree' ? c.formspreeEndpoint : `mailto:${c.emailContato}`;
        const metodo = c.provedor === 'formspree' ? 'post' : 'post';
        corpo = `
          <form class="formNativo" action="${escapar(action)}" method="${metodo}"${c.provedor === 'mailto' ? ' enctype="text/plain"' : ''}>
            <label>Nome<input type="text" name="nome" required autocomplete="name"></label>
            <label>E-mail<input type="email" name="email" required autocomplete="email"></label>
            <label>Unidade / regional<input type="text" name="unidade" placeholder="Ex.: Brasília, Recife, remoto"></label>
            <label>Ano de ingresso
              <select name="ingresso">
                <option>Concurso 2023</option>
                <option>Antes de 2023</option>
                <option>Depois de 2023</option>
              </select>
            </label>
            <label>Quer contribuir com a campanha? Conte como (opcional)
              <textarea name="mensagem" placeholder="Sugestão de pauta, fonte de documento, disponibilidade para mobilização…"></textarea>
            </label>
            <label class="checkLinha">
              <input type="checkbox" name="consentimento" required>
              <span>Autorizo o uso do meu e-mail para receber informes da campanha salarial.</span>
            </label>
            <div class="acoes"><button class="btn primario" type="submit">Quero receber informes</button></div>
          </form>`;
      }

      return `
      <section class="bloco"${attrId(b)}><div class="container">
        ${cabecalhoBloco(b)}
        <div class="formBox">${corpo}</div>
        ${c.politicaDados ? `<p class="rodapeBloco">🔒 ${fmt(c.politicaDados)}</p>` : ''}
      </div></section>`;
    }
  };

  /* --------------------------- layout do site --------------------------- */

  const montarCabecalho = (cfg, paginaAtual) => {
    const aviso = cfg.avisoTopo && cfg.avisoTopo.ativo
      ? `<div class="avisoTopo">${fmt(cfg.avisoTopo.texto)}
           ${cfg.avisoTopo.link ? ` <a href="${escapar(cfg.avisoTopo.link)}">${fmt(cfg.avisoTopo.textoLink || 'Saiba mais')}</a>` : ''}
         </div>`
      : '';

    return `${aviso}
      <header class="siteHeader"><div class="container">
        <div class="marca">
          <a href="index.html">${fmt(cfg.nome)}</a>
          <span>${fmt(cfg.subtitulo || '')}</span>
        </div>
        <button class="navToggle" type="button" aria-expanded="false" aria-label="Abrir menu">☰</button>
        <nav class="nav">${(cfg.menu || []).map((m) => {
          const ativo = m.href === paginaAtual ? ' ativo' : '';
          return `<a class="${m.destaque ? 'destaque' : ''}${ativo}" href="${escapar(m.href)}">${fmt(m.titulo)}</a>`;
        }).join('')}</nav>
      </div></header>`;
  };

  const montarRodape = (cfg) => `
    <footer class="siteFooter"><div class="container">
      <div class="grid">
        <div>
          <h4>${fmt(cfg.nome)}</h4>
          <p>${fmt(cfg.rodape.texto)}</p>
        </div>
        <div>
          <h4>Navegue</h4>
          <ul>${(cfg.menu || []).map((m) => `<li><a href="${escapar(m.href)}">${fmt(m.titulo)}</a></li>`).join('')}</ul>
        </div>
        <div>
          <h4>Contato</h4>
          <ul>${(cfg.contatos || []).map((c) =>
            `<li><a href="${escapar(c.href)}">${fmt(c.icone || '')} ${fmt(c.rotulo)}</a></li>`).join('')}</ul>
          <h4 style="margin-top:16px">Redes</h4>
          <ul>${(cfg.redes || []).map((r) =>
            `<li><a href="${escapar(r.href)}" target="_blank" rel="noopener">${fmt(r.rotulo)}</a></li>`).join('')}</ul>
        </div>
      </div>
      <div class="creditos">
        <p>${fmt(cfg.rodape.creditos)}</p>
        <p>${fmt(cfg.rodape.licenca)} · Última atualização: ${escapar(cfg.atualizadoEm)}</p>
      </div>
    </div></footer>`;

  /* -------------------------- comportamentos UI ------------------------- */

  const ativarInteracoes = (cfg) => {
    const toggle = document.querySelector('.navToggle');
    const nav = document.querySelector('.nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const aberto = nav.classList.toggle('aberto');
        toggle.setAttribute('aria-expanded', String(aberto));
      });
    }

    const url = location.href;
    const texto = `${document.title} — ${cfg.nome}`;
    document.querySelectorAll('[data-acao="whatsapp"]').forEach((a) => {
      a.href = `https://wa.me/?text=${encodeURIComponent(`${texto}\n${url}`)}`;
    });
    document.querySelectorAll('[data-acao="telegram"]').forEach((a) => {
      a.href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texto)}`;
    });
    document.querySelectorAll('[data-acao="copiar-link"]').forEach((b) => {
      b.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(url);
          const antes = b.textContent;
          b.textContent = '✅ Link copiado!';
          setTimeout(() => { b.textContent = antes; }, 2000);
        } catch { window.prompt('Copie o link:', url); }
      });
    });
    document.querySelectorAll('[data-acao="imprimir"]').forEach((b) => {
      b.addEventListener('click', () => window.print());
    });

    const topo = el('<button class="aoTopo" type="button" aria-label="Voltar ao topo">↑</button>');
    topo.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(topo);
    window.addEventListener('scroll', () => {
      topo.classList.toggle('visivel', window.scrollY > 600);
    }, { passive: true });
  };

  /* ------------------------------- boot --------------------------------- */

  const iniciar = async (arquivoPagina) => {
    const main = document.getElementById('conteudo');
    try {
      const [cfg, pagina] = await Promise.all([carregar('site.json'), carregar(arquivoPagina)]);

      const atual = location.pathname.split('/').pop() || 'index.html';
      document.title = `${pagina.titulo} · ${cfg.nome}`;
      document.documentElement.lang = cfg.idioma || 'pt-BR';

      const t = cfg.tema || {};
      const raiz = document.documentElement.style;
      if (t.corPrimaria) raiz.setProperty('--primaria', t.corPrimaria);
      if (t.corSecundaria) raiz.setProperty('--secundaria', t.corSecundaria);
      if (t.corDestaque) raiz.setProperty('--destaque', t.corDestaque);
      if (t.corFundo) raiz.setProperty('--fundo', t.corFundo);
      if (t.corTexto) raiz.setProperty('--texto', t.corTexto);

      document.getElementById('cabecalho').innerHTML = montarCabecalho(cfg, atual);
      main.innerHTML = (pagina.blocos || []).map((b) => {
        const r = renderers[b.tipo];
        return r ? r(b, cfg) : `<!-- bloco desconhecido: ${escapar(b.tipo)} -->`;
      }).join('');
      document.getElementById('rodape').innerHTML = montarRodape(cfg);

      ativarInteracoes(cfg);

      if (location.hash) {
        const alvo = document.querySelector(location.hash);
        if (alvo) alvo.scrollIntoView();
      }
    } catch (e) {
      main.innerHTML = `<section class="bloco"><div class="container">
        <div class="avisoBox atencao">
          <h3>Não foi possível carregar o conteúdo</h3>
          <p>${escapar(e.message)}</p>
          <p>Se você abriu o arquivo direto do disco (<code>file://</code>), inicie um servidor local:
          <code>python3 -m http.server 8000</code> e acesse <code>http://localhost:8000</code>.</p>
        </div>
      </div></section>`;
    }
  };

  return { iniciar };
})();

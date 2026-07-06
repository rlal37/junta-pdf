# Juntar PDF

Aplicativo web para juntar múltiplos arquivos PDF em um único documento. Roda **inteiramente no navegador**, sem backend — seus arquivos nunca saem da sua máquina.

**➡️ Acesse: [rlal37.github.io/junta-pdf](https://rlal37.github.io/junta-pdf/)**

## Funcionalidades

- Selecionar ou arrastar-soltar vários arquivos PDF
- Miniatura da primeira página de cada arquivo, para identificar rapidamente qual é qual
- Nome e número de páginas de cada PDF
- Reordenar a lista antes de juntar (arrastar-soltar ou botões ↑/↓, com navegação por teclado)
- Juntar tudo num único PDF e baixar o resultado
- Feedback claro de carregamento, sucesso e erro (ex.: arquivo corrompido ou que não é PDF)

## Privacidade

Todo o processamento acontece no navegador do usuário. Nenhum arquivo é enviado para servidores — não há backend nem serviço externo envolvido.

## Stack

- HTML, CSS e JavaScript puro (sem framework, sem bundler)
- [pdf-lib](https://pdf-lib.js.org/) — junção dos PDFs no navegador
- [PDF.js](https://mozilla.github.io/pdf.js/) — renderização das miniaturas
- Ambas via CDN
- Deploy: GitHub Pages

## Rodar localmente

Não há build. Basta abrir o `index.html` direto no navegador ou servir a pasta com um servidor estático simples, por exemplo:

```
npx serve .
```

## Estrutura

```
junta-pdf/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Deploy

O site é publicado automaticamente pelo GitHub Pages a partir da branch `main` (raiz). Qualquer `git push` para `main` republica o site em cerca de 1–2 minutos.

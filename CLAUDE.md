# Projeto: junta-pdf

Aplicativo web para juntar múltiplos arquivos PDF em um único documento. Roda inteiramente no navegador, sem backend.

## Stack

- HTML, CSS e JavaScript puro (sem framework, sem bundler)
- [pdf-lib](https://pdf-lib.js.org/) via CDN, para manipulação dos PDFs no navegador
- Deploy: GitHub Pages

## Comandos

- Não há build. Para testar localmente, abrir `index.html` direto no navegador ou rodar um servidor simples:
  ```
  npx serve .
  ```
- Deploy: push para a branch `main` (GitHub Pages já configurado a partir dela, ou da pasta `/docs`, conforme configuração do repositório).

## Estrutura esperada

```
junta-pdf/
├── index.html
├── style.css
├── script.js
└── CLAUDE.md
```

Manter tudo em poucos arquivos. Não introduzir framework, empacotador ou dependências de build sem discutir antes.

## Funcionalidades principais

- Selecionar/arrastar múltiplos arquivos PDF
- Reordenar a lista antes de juntar (drag-and-drop)
- Mostrar nome e número de páginas de cada arquivo
- Juntar todos em um único PDF e permitir o download
- Feedback claro de progresso e de erros (ex: arquivo corrompido, não é PDF)

## Convenções de código

- JavaScript em módulos simples, funções pequenas e nomeadas com clareza
- Comentários em português, direto ao ponto
- Sem lógica de negócio dentro de arquivos de estilo ou markup
- Ao alterar aparência (CSS), não mexer na lógica de JS já funcional, a menos que pedido explicitamente

## Não fazer

- Não adicionar backend, servidor ou serviço externo de processamento — tudo deve rodar no navegador do usuário (privacidade: os PDFs do usuário não devem sair da máquina dele)
- Não trocar pdf-lib por outra lib sem justificativa
- Não remover mensagens de erro/feedback visual em troca de "simplicidade"

---

# Guia de estilo

Ponto de partida. Pode ser ajustado — este é um app utilitário, então a estética deve priorizar clareza sobre personalidade forte.

## Paleta de cores

| Uso | Cor | Hex |
|---|---|---|
| Fundo principal | Off-white | `#FAFAF8` |
| Superfície (cards, painéis) | Branco | `#FFFFFF` |
| Texto principal | Cinza-chumbo | `#1F2328` |
| Texto secundário | Cinza médio | `#5B6168` |
| Cor de destaque (ação primária) | Azul profundo | `#2952CC` |
| Destaque hover | Azul mais escuro | `#1F3E9E` |
| Sucesso | Verde | `#1F8A5C` |
| Erro/alerta | Terracota | `#C0473B` |
| Borda/divisor | Cinza claro | `#E4E5E7` |

## Tipografia

- Fonte: **Inter** (Google Fonts) ou fonte de sistema (`-apple-system, Segoe UI, sans-serif`) como fallback
- Tamanho base: 16px
- Títulos: peso 600–700
- Corpo de texto: peso 400
- Line-height confortável: 1.5 para texto corrido

## Espaçamento

- Escala base de 8px: 8 / 16 / 24 / 32 / 48px
- Espaçamento entre elementos de formulário/lista: 16px
- Padding interno de cards/painéis: 24px

## Componentes

- Botão primário: fundo azul de destaque, texto branco, cantos arredondados (8px), estado de hover e estado de foco visível
- Área de drop (arrastar arquivos): borda tracejada, muda de cor/fundo levemente quando um arquivo é arrastado por cima
- Lista de arquivos: cada item com nome, número de páginas, botão de remover e alça de arrastar para reordenar

---

# Diretrizes de usabilidade e boas práticas

Seguir estes princípios em toda decisão de interface, mesmo quando não explicitamente pedido:

## Acessibilidade

- Contraste mínimo AA (4.5:1 para texto normal, 3:1 para texto grande) entre texto e fundo
- Todo elemento interativo precisa de estado de **foco visível** (não remover o outline sem substituir por alternativa visível)
- Área de toque mínima de 44x44px para botões e alças de arraste, pensando em uso mobile
- Textos alternativos (`alt`) em ícones que comuniquem informação, não apenas decorativos
- Navegação por teclado funcional (tab, enter, espaço) para todas as ações, incluindo reordenar a lista

## Feedback e estado

- Toda ação (adicionar arquivo, remover, juntar, baixar) deve ter feedback visual imediato
- Estados de carregamento explícitos durante o processamento dos PDFs (o merge pode levar alguns segundos com arquivos grandes)
- Mensagens de erro específicas e acionáveis (ex: "Este arquivo não é um PDF válido" em vez de "Erro")
- Confirmar visualmente quando a ação foi concluída com sucesso (ex: PDF final pronto para download)

## Clareza e prevenção de erros

- Preferir enviar problema não-realizável a uma ação irreversível: nada de deletar/limpar tudo sem confirmação
- Deixar claro, antes de qualquer processamento, quantos arquivos serão juntados e em qual ordem
- Evitar textos vagos ("clique aqui", "ok"); usar verbos específicos ("Juntar PDFs", "Remover arquivo")

## Responsividade

- Funcional em mobile, tablet e desktop
- Lista de arquivos deve ser utilizável em telas pequenas (reordenar por toque, não só por mouse)

## Verificação

- Depois de qualquer mudança visual relevante, tirar um screenshot e comparar com a referência antes de considerar concluído
- Ao revisar uma tela nova, checar contraste, área de toque e navegação por teclado antes de aprovar

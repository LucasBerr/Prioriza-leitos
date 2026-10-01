# Guia do Prioriza-leitos

Leia primeiro o `AGENTS.md` do diretório pai. Este repositório é a interface do MVP e a única interface relevante para o pitch atual.

## Papel e limites

Dashboard estático, preparado para GitHub Pages, que identifica e explica prioridades relativas de investigação e possível investimento em leitos SUS nos municípios do Rio Grande do Sul.

O MVP ativo cobre três tipos:

- `obstetrico`;
- `pediatrico`;
- `uti_adulto`.

Não ativar as páginas de UTI neonatal, pediátrica, coronariana ou queimado como novas categorias. Elas são redirecionamentos e não fazem parte do escopo aprovado.

## Arquitetura atual

Não há backend, etapa de build ou gerenciador de pacotes. O navegador carrega HTML, CSS, JavaScript e os artefatos publicados em `data/`.

Pontos de entrada:

- `index.html`: mapa, filtros, busca e detalhes do município;
- `entenda-o-score.html`: explicação dos componentes e simulador de pesos;
- `assets/js/app.js`: tipos, pesos padrão, carregamento de dados e utilitários compartilhados;
- `assets/js/maps.js`: mapa, ranking filtrado e detalhes;
- `assets/js/score.js`: decomposição do score e edição dos pesos;
- `assets/js/charts.js`: gráficos Plotly usados pelas páginas correspondentes;
- `assets/css/styles.css`: estilos compartilhados e comportamento responsivo;
- `data/rankings.json`: contrato principal consumido pela aplicação;
- `data/municipios.geojson`: artefato geográfico publicado; confirme o consumidor antes de alterar;
- `README.md`, `dados-e-metodologia.md`, `relatorio.md`: documentação funcional e metodológica.

Algumas páginas temáticas somente redirecionam. Confirme seu conteúdo antes de tratá-las como telas independentes.

## Dados publicados

O `rankings.json` publicado possui 1.491 registros: 497 municípios × 3 tipos, com ano de referência 2025. Cada linha representa `municipio + ano + tipo_leito`.

Preservar os nomes de campos consumidos pelo JavaScript. Os principais grupos são:

- identificação e regionalização;
- população-alvo, internações e oferta SUS;
- demanda, déficit de oferta, evasão, risco e crescimento normalizados;
- `score_prioridade_mvp` e `faixa_prioridade`.

Os dados brutos e intermediários não pertencem a este repositório de publicação. A rotina executável que produziu os artefatos atuais não está identificada neste checkout.

## Score e pesos

Pesos padrão definidos em `assets/js/app.js`:

- demanda residente: 30%;
- déficit de oferta regional: 30%;
- evasão intermunicipal observada: 15%;
- tendência de crescimento da população-alvo: 15%;
- risco populacional: 10%.

O score é uma soma ponderada dos componentes normalizados. Pesos personalizados são salvos no `localStorage` sob a chave `prioriza-score-weights` e alteram a ordenação exibida no mapa. O score oficial continua sendo o cenário padrão.

Manter os pesos editáveis. Cenários especializados são evolução futura dependente de validação humana; não declarar os pesos atuais como validados.

## Execução e verificação

Como os JSONs são carregados por `fetch()`, servir a raiz do repositório por HTTP, por exemplo:

```bash
python -m http.server 8000
```

Abrir `http://localhost:8000/` e verificar, conforme a mudança:

- carregamento sem erro de `data/rankings.json`;
- os cinco tipos de leito;
- busca, filtros, seleção e ordenação;
- ida ao explicador e retorno ao mesmo município/tipo via query string;
- edição, soma, salvamento e restauração dos pesos;
- layout em larguras desktop e móvel;
- mensagens que diferenciam prioridade relativa de recomendação automática.

Leaflet, OpenStreetMap e Plotly são dependências carregadas remotamente em páginas que as utilizam; indisponibilidade de rede pode afetar a verificação visual.

## Notebooks

`nootbooks/` contém material de entendimento, feature engineering e score. As referências a `src.models` e `data/processed` não existem neste repositório nem no motor disponível no workspace. Trate os notebooks como documentação histórica até a origem do pipeline ser identificada.

Não recriar uma arquitetura a partir dessas referências sem validar com o responsável.

## Regras para mudanças

- Manter o site estático e compatível com GitHub Pages.
- Não integrar diretamente com o motor nesta fase.
- Não adicionar tipos, estados ou funcionalidades antes da validação comercial.
- Não substituir a linguagem de prioridade relativa por recomendação automática.
- Alterações nos pesos, componentes ou cortes de prioridade são mudanças metodológicas e exigem validação explícita.

## Próximos passos adiados

Registrar para retomada posterior, sem implementar nesta etapa:

- Ajustar o botão `?` dos componentes para abrir de forma visível a explicação completa de origem, cálculo e normalização da métrica.
- Disponibilizar e exibir no pop-up o valor bruto de crescimento. Isso depende de publicar esse dado no artefato de dados ou de identificar a origem que o produz; não estimar nem reconstruir o valor no navegador.

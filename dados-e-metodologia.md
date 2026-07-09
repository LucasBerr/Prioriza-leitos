# Dados e metodologia

Este documento descreve os arquivos de dados publicados junto com a aplicacao web do Prioriza Leitos BD2.

O repositorio foi preparado para GitHub Pages e contem apenas os dados finais necessarios para visualizacao no navegador. Os dados brutos, arquivos intermediarios e tabelas Parquet do pipeline analitico nao foram incluidos.

## Arquivos publicados

```text
data/
├── rankings.json
└── municipios.geojson
```

## `data/rankings.json`

Arquivo principal do dashboard. Ele contem os resultados analiticos usados para montar rankings, cartoes, filtros e visualizacoes por tipo de leito.

Estrutura geral:

```text
metadata
records
```

### `metadata`

Traz informacoes gerais sobre a base publicada:

- `ano`: ano de referencia do score exibido.
- `unidade_analitica`: granularidade usada no projeto.
- `escopo`: recorte geografico.
- `mensagem_metodologica`: aviso de interpretacao do score.
- `tipos_leito`: dicionario com os tipos de leito disponiveis no MVP.

### `records`

Lista de registros por municipio e tipo de leito. Cada registro representa a situacao de um municipio em um tipo de leito especifico.

Campos principais:

| Campo | Descricao |
| --- | --- |
| `municipio_id` | Codigo IBGE de 7 digitos do municipio |
| `municipio_nome` | Nome do municipio |
| `regiao_saude` | Regiao de saude da SES/RS |
| `macroregiao_saude` | Macrorregiao de saude |
| `latitude` | Latitude do municipio |
| `longitude` | Longitude do municipio |
| `ano` | Ano de referencia |
| `tipo_leito` | Tipo de leito analisado |
| `populacao_alvo` | Populacao usada como denominador no tipo de leito |
| `internacoes_residentes` | Internacoes de residentes do municipio |
| `internacoes_residentes_fora` | Internacoes de residentes realizadas fora do municipio |
| `demanda_residente_taxa_por_1000_pop_alvo` | Taxa de internacoes por 1.000 pessoas da populacao alvo |
| `leitos_sus_media` | Media de leitos SUS disponiveis |
| `oferta_sus_por_1000_pop_alvo` | Oferta de leitos SUS por 1.000 pessoas da populacao alvo |
| `evasao_hospitalar_raw` | Proporcao bruta de internacoes fora do municipio |
| `demanda_residente_normalizada` | Componente normalizado de demanda |
| `deficit_oferta_sus_normalizado` | Componente normalizado de deficit de oferta |
| `evasao_hospitalar_normalizada` | Componente normalizado de evasao hospitalar |
| `risco_populacional_normalizado` | Componente normalizado de risco populacional |
| `crescimento_demanda_normalizado` | Componente normalizado de crescimento da demanda |
| `score_prioridade_mvp` | Score final de prioridade relativa |
| `faixa_prioridade` | Classificacao textual da prioridade |

## `data/municipios.geojson`

Arquivo geoespacial usado para posicionar os municipios no mapa.

Estrutura geral:

```text
FeatureCollection
```

Cada `Feature` possui:

- `geometry`: ponto com coordenadas `[longitude, latitude]`;
- `properties.municipio_id`: codigo IBGE do municipio;
- `properties.municipio_nome`: nome do municipio;
- `properties.regiao_saude`: regiao de saude;
- `properties.macroregiao_saude`: macrorregiao de saude.

O arquivo nao contem poligonos municipais completos. Ele usa pontos para manter o site leve e adequado para publicacao estatica.

## Fontes originais

As informacoes publicadas sao derivadas de fontes publicas e oficiais:

- CNES/DATASUS, para oferta de leitos SUS;
- SIH/SUS/DATASUS, para internacoes hospitalares;
- IBGE, para populacao, codigos municipais e dados geograficos;
- SES/RS, para regionalizacao;
- SINASC/DATASUS, para nascidos vivos;
- SIM/DATASUS, para mortalidade.

## Por que os dados brutos nao estao neste repositorio

Este repositorio tem a finalidade de publicar o dashboard no GitHub Pages. Por isso, ele deve ser pequeno, simples e diretamente executavel no navegador.

Os dados brutos e intermediarios nao foram incluidos porque:

- sao maiores que o necessario para a publicacao do site;
- podem ser regenerados a partir das fontes oficiais;
- dificultariam o uso do repositorio como projeto estatico;
- misturariam pipeline de dados com artefatos finais de visualizacao;
- aumentariam o risco de versionar arquivos temporarios ou desnecessarios.

O repositorio de publicacao contem apenas os arquivos finais que a aplicacao consome no navegador.

## Interpretacao do score

O score e uma medida relativa para apoiar investigacao. Ele nao representa decisao automatica de abertura de leitos.

A leitura recomendada e:

> municipio com alta prioridade relativa para investigacao e possivel investimento.

Pontos de cuidado:

- ausencia de leito local nao significa, sozinha, necessidade de investimento;
- municipios pequenos podem depender legitimamente de atendimento regional;
- municipios polo podem concentrar demanda de outros municipios;
- leitos especializados podem exigir analise regional ou macrorregional;
- decisoes reais dependem de planejamento, equipe, estrutura fisica, financiamento e pactuacao no SUS.

## Publicacao no GitHub Pages

Os arquivos `rankings.json` e `municipios.geojson` devem permanecer dentro da pasta `data/`, pois os scripts JavaScript do site fazem a leitura desses caminhos.

Ao publicar no GitHub Pages, a estrutura esperada e:

```text
/
├── index.html
├── assets/
└── data/
```

Assim, o navegador consegue carregar os dados com caminhos relativos.

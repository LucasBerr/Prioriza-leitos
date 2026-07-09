# Prioriza Leitos BD2

Aplicacao web interativa para apoiar a analise de prioridade relativa de investimento em leitos hospitalares do SUS nos municipios do Rio Grande do Sul.

Este repositorio contem apenas a versao estatica do dashboard, preparada para publicacao via GitHub Pages.

## Informacoes do trabalho

**Disciplina:** Banco de Dados 2  
**Turma:** T3  
**Instituicao:** Pontificia Universidade Catolica do Rio Grande do Sul  
**Ano/Semestre:** 2026  
**Grupo:** Leitos
**Integrantes:** Lucas Tabelli Berr, Alice Martofel Guzas  

## Objetivo

O projeto busca responder, de forma transparente e baseada em dados abertos, quais municipios do Rio Grande do Sul apresentam maior prioridade relativa para investigacao e possivel investimento em leitos hospitalares do SUS.

A aplicacao nao substitui decisoes tecnicas do SUS. O resultado deve ser interpretado como um apoio analitico para investigacao, planejamento e discussao publica.

## Tema e contexto

A distribuicao de leitos hospitalares é uma decisao publica relevante porque afeta acesso, deslocamento de pacientes, sobrecarga de municípios polo e uso de recursos publicos. Como os recursos sao limitados, a analise considera oferta, demanda, populacao e componentes de risco para comparar municipios de forma auditavel.

O recorte inicial do projeto e o estado do Rio Grande do Sul, com analises por municipio, ano e tipo de leito.

## Questoes de negocio

- Quais municipios possuem maior prioridade relativa para investigacao de novos investimentos em leitos SUS?
- Quais municipios apresentam baixa oferta de leitos em relacao a populacao?
- Onde ha maior pressao de demanda hospitalar?
- Quais municipios dependem mais de atendimento hospitalar em outras cidades?
- Como o resultado muda entre tipos de leito diferentes?

## Fontes de dados

As bases utilizadas sao publicas e oficiais:

- **CNES/DATASUS:** oferta de leitos hospitalares SUS.
- **SIH/SUS/DATASUS:** internacoes hospitalares financiadas pelo SUS.
- **IBGE:** populacao municipal e malha territorial.
- **SES/RS:** regionalizacao em regioes e macrorregioes de saude.
- **SINASC/DATASUS:** nascidos vivos, usado em indicadores materno-infantis.
- **SIM/DATASUS:** mortalidade, usado em indicadores complementares.

Os dados brutos e intermediarios nao fazem parte deste repositorio de publicacao, pois sao artefatos regeneraveis e podem ser grandes. Este pacote contem apenas os arquivos necessarios para exibir o dashboard.

## Metodologia resumida

O pipeline original consolida os dados em tabelas analiticas por municipio, ano e tipo de leito. A partir dessas tabelas sao calculados indicadores comparaveis, como oferta de leitos SUS, demanda hospitalar, populacao e componentes auxiliares.

O score de prioridade e um baseline transparente baseado em regras. Ele combina componentes interpretaveis para produzir um ranking relativo. A linguagem correta do resultado é "prioridade relativa para investigacao e possivel investimento", nao uma recomendacao automatica de abertura de leitos.

## Tipos de leito

O dashboard contempla paginas e filtros para:

- Leitos clinicos.
- Leitos cirurgicos.
- Leitos obstetricos.
- Leitos pediatricos.
- UTI Adulto.

Alguns tipos especializados devem ser interpretados com cuidado, pois podem exigir analise regional e nao apenas municipal.

## Estrutura do repositorio

```text
.
├── index.html
├── entenda-o-score.html
├── metodologia.html
├── limitacoes.html
├── ranking-geral.html
├── leitos-*.html
├── uti-*.html
├── assets/
│   ├── css/
│   └── js/
└── data/
    ├── rankings.json
    └── municipios.geojson
```

## Como abrir localmente

Por usar arquivos JSON via `fetch()`, o ideal e abrir com um servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Relacao com os requisitos do projeto

Este dashboard web foi organizado para atender a proposta de uma aplicacao interativa de inteligencia de negocios:

- possui navegacao por paginas tematicas;
- apresenta mapa, ranking, cartoes e visualizacoes comparativas;
- utiliza filtros por tipo de leito e regiao;
- usa dados publicos e fontes oficiais;
- documenta metodologia, limitacoes e cuidados de interpretacao.

## Limitacoes

- O score e relativo e depende das regras metodologicas definidas.
- Ausencia local de leitos nao significa, isoladamente, necessidade automatica de investimento.
- Municipios polo podem apresentar alta demanda por atender pacientes de outros municipios.
- Leitos especializados, como UTI Neonatal, UTI Queimado e UTI Coronariana, podem exigir analise regional.
- O projeto apoia investigacao e planejamento; nao substitui regulacao, pactuacao regional ou decisao tecnica do SUS.

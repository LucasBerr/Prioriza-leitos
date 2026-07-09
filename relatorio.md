# Relatorio do Projeto - Prioriza Leitos

**Disciplina:** Banco de Dados 2  
**Turma:** T3  
**Instituicao:** Pontificia Universidade Catolica do Rio Grande do Sul  
**Professora:** Dra. Aline de Campos  
**Ano/Semestre:** 2026/1  
**Grupo:** Leitos SUS
**Integrantes:** Lucas Tabelli Berr, Alice Martofel Guzas

## 1. Contextualizacao

A alocacao de leitos hospitalares no Sistema Unico de Saude (SUS) e uma decisao publica de grande impacto, pois influencia o acesso da populacao ao atendimento hospitalar, o deslocamento de pacientes entre municipios e a sobrecarga de hospitais de referencia.

No Rio Grande do Sul, diferentes municipios apresentam realidades distintas em relacao a oferta de leitos, demanda hospitalar, tamanho populacional e papel regional na rede de saude. Por isso, uma analise baseada em dados abertos pode apoiar a identificacao de municipios com maior prioridade relativa para investigacao e possivel investimento em leitos hospitalares do SUS.

O projeto Prioriza Leitos foi desenvolvido com o objetivo de organizar dados publicos de saude e demografia em uma aplicacao interativa, permitindo visualizar rankings, mapas e indicadores por tipo de leito. A proposta nao substitui decisoes tecnicas do SUS, mas oferece uma ferramenta de apoio para analise, transparencia e discussao publica.

## 2. Questoes de negocio

O dashboard foi construido para apoiar as seguintes perguntas:

1. Quais municipios do Rio Grande do Sul apresentam maior prioridade relativa para investigacao de investimento em leitos SUS?
2. Quais municipios possuem menor oferta de leitos em relacao a sua populacao?
3. Quais municipios apresentam maior pressao de demanda hospitalar?
4. Quais municipios dependem de atendimento hospitalar em outras cidades?
5. Como a prioridade muda conforme o tipo de leito analisado?
6. Quais componentes mais influenciam o score final de cada municipio?

Essas perguntas ajudam a transformar dados publicos dispersos em informacoes uteis para comparacao entre municipios e apoio a tomada de decisao.

## 3. Fonte de dados

As bases utilizadas no projeto sao publicas e oficiais:

| Fonte | Uso no projeto |
| --- | --- |
| CNES/DATASUS | Oferta de leitos hospitalares SUS por municipio e tipo de leito |
| SIH/SUS/DATASUS | Internacoes hospitalares financiadas pelo SUS |
| IBGE | Populacao municipal, denominadores e malha territorial |
| SES/RS | Regioes e macrorregioes de saude |
| SINASC/DATASUS | Nascidos vivos e indicadores materno-infantis |
| SIM/DATASUS | Mortalidade e indicadores complementares |

O recorte geografico do projeto e o estado do Rio Grande do Sul. A unidade analitica principal e:

```text
municipio + ano + tipo de leito
```

O periodo de referencia do MVP considera dados de 2019 a 2025, respeitando a disponibilidade final de cada base. Bases anuais como SINASC e SIM possuem disponibilidade final mais recente ate 2024.

## 4. Extracao, limpeza e tratamento dos dados

A extracao dos dados foi planejada a partir de fontes abertas. Os arquivos brutos do DATASUS foram obtidos em formato `.dbc`, enquanto dados do IBGE foram obtidos por arquivos e APIs publicas.

O processo de preparacao envolveu:

- download dos arquivos brutos por fonte e periodo;
- conversao de arquivos `.dbc` para formato intermediario Parquet;
- padronizacao de codigos municipais;
- recorte para municipios do Rio Grande do Sul;
- consolidacao de dados por municipio, ano e tipo de leito;
- tratamento de campos numericos;
- separacao entre municipio de residencia e municipio de internacao;
- classificacao dos tipos de leito a partir de tabelas tecnicas;
- geracao de arquivos finais em JSON e GeoJSON para uso no dashboard.

Os dados brutos e intermediarios nao foram incluidos neste repositorio de publicacao porque sao arquivos regeneraveis e podem ter tamanho elevado. O repositorio do site contem apenas os dados finais necessarios para a visualizacao:

- `data/rankings.json`
- `data/municipios.geojson`

## 5. Construcao da aplicacao

A aplicacao foi construida como um dashboard web estatico, utilizando HTML, CSS e JavaScript. Essa escolha permite publicacao simples no GitHub Pages e acesso direto pelo navegador.

A estrutura da aplicacao inclui:

- pagina inicial com visao geral do projeto;
- mapa interativo dos municipios do Rio Grande do Sul;
- rankings por tipo de leito;
- paginas especificas para leitos clinicos, cirurgicos, obstetricos, pediatricos e UTIs;
- pagina explicando a composicao do score;
- pagina de metodologia;
- pagina de limitacoes.

As visualizacoes foram organizadas para atender aos requisitos de uma aplicacao interativa de inteligencia de negocios, incluindo diferentes formas de apresentacao:

- mapa;
- ranking/lista;
- cartoes de indicadores;
- graficos comparativos;
- filtros por tipo de leito e recortes regionais.

## 6. Metodologia do score

O score utilizado e um baseline transparente baseado em regras. A ideia principal e combinar componentes interpretaveis para gerar uma prioridade relativa entre municipios.

A interpretacao correta do resultado e:

> municipio com alta prioridade relativa para investigacao e possivel investimento.

O score nao deve ser lido como uma recomendacao automatica de abertura de leitos. A decisao real depende de analise tecnica, pactuacao regional, disponibilidade de equipe, infraestrutura, financiamento e planejamento do SUS.

Os principais criterios considerados envolvem:

- oferta relativa de leitos SUS;
- demanda hospitalar;
- populacao e denominadores especificos;
- dependencia de atendimento fora do municipio;
- papel regional do municipio;
- indicadores complementares por tipo de leito.

## 7. Analise de resultados

Ao utilizar o dashboard, e possivel observar diferencas relevantes entre municipios e tipos de leito. Municipios com baixa oferta relativa, alta demanda hospitalar e maior dependencia de atendimento externo tendem a aparecer com prioridade mais alta.

Tambem e importante observar que municipios polo podem apresentar alta demanda porque recebem pacientes de outras cidades. Portanto, uma pontuacao elevada deve ser interpretada em conjunto com o contexto regional, e nao apenas como uma caracteristica isolada do municipio.

Os resultados permitem:

- comparar municipios dentro do mesmo tipo de leito;
- identificar areas com potencial pressao sobre a rede hospitalar;
- discutir necessidades especificas por perfil populacional;
- apoiar a leitura publica sobre distribuicao de recursos de saude.

## 8. Limitacoes

O projeto possui limitacoes metodologicas importantes:

- ausencia local de leitos nao implica automaticamente necessidade de investimento;
- municipios pequenos podem depender de redes regionais de atendimento;
- municipios polo podem apresentar demanda elevada por atenderem pacientes de fora;
- alguns tipos de leito especializados devem ser analisados em escala regional;
- o score é uma medida relativa e depende das regras escolhidas;
- o projeto nao considera custo de implantacao, disponibilidade de profissionais ou estrutura fisica detalhada.

Essas limitacoes reforcam que o dashboard deve ser usado como ferramenta de apoio a investigacao e nao como decisao final.

## 9. Conclusao

O Prioriza Leitos organiza dados publicos de saude e populacao em uma aplicacao interativa para analisar a prioridade relativa de investimento em leitos hospitalares do SUS no Rio Grande do Sul.

A aplicacao contribui para transformar bases tecnicas em informacoes mais acessiveis, permitindo comparacao entre municipios, visualizacao de rankings e entendimento dos principais componentes do score.

Como continuidade, o projeto pode ser aprimorado com novos indicadores, validacao com especialistas e aprofundamento regional para leitos de alta complexidade.

## 10. Referencias

- DATASUS. Cadastro Nacional de Estabelecimentos de Saude - CNES.
- DATASUS. Sistema de Informacoes Hospitalares do SUS - SIH/SUS.
- DATASUS. Sistema de Informacoes sobre Nascidos Vivos - SINASC.
- DATASUS. Sistema de Informacoes sobre Mortalidade - SIM.
- Instituto Brasileiro de Geografia e Estatistica - IBGE.
- Secretaria Estadual da Saude do Rio Grande do Sul - SES/RS.

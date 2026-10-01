# Contrato de dados do Prioriza Leitos

O dashboard consome `data/rankings.json`, produzido pelo motor analítico e publicado manualmente neste repositório. Não há integração em tempo de execução entre os dois projetos.

Para desenhar a cobertura regional no mapa, a interface também consome `data/municipios_limites.geojson`: a malha municipal do IBGE 2022 publicada como artefato estático. O arquivo `data/municipios.geojson` contém somente pontos e permanece destinado aos consumidores que precisam dessa representação.

## Escopo publicado

- Referência: 2025.
- Território: 497 municípios do Rio Grande do Sul.
- Tipos ativos: `uti_adulto`, `obstetrico` e `pediatrico`.
- Unidade: uma linha por município, ano e tipo de leito.
- Total esperado: 1.491 linhas.

## Metadados

`metadata` descreve versão do contrato, ano, tipos ativos, pesos padrão, fontes, limitações e mensagem metodológica. A interface deve apresentar prioridade como apoio à investigação, nunca como recomendação automática.

## Campos por registro

| Grupo | Campos principais | Uso no dashboard |
| --- | --- | --- |
| Identificação | `municipio_id`, `municipio_nome`, `ano`, `tipo_leito`, `latitude`, `longitude`, `regiao_saude`, `macroregiao_saude` | mapa, filtros e cabeçalho |
| Score | `score_padrao_0_100`, `posicao_relativa_por_tipo`, `faixa_prioridade` | anel de score, ranking e faixa |
| Demanda | `internacoes_residentes`, `populacao_alvo`, `demanda_residente_taxa_por_1000_pop_alvo`, `demanda_residente_normalizado_0_100` | resumo e card de demanda |
| Cobertura regional | `leitos_sus_locais_registrados`, `polo_municipio_id`, `polo_e_municipio_origem`, `municipios_associados_polo`, `populacao_alvo_regional`, `leitos_sus_polo_acessiveis`, `pressao_regional_por_leito`, `duracao_rota_horas`, `oferta_acessivel_24h`, `deficit_oferta_regional_normalizado_0_100` | bloco de cobertura e card de déficit |
| Evasão | `evasao_hospitalar_percentual`, `internacoes_fora_municipio`, `internacoes_locais`, `possui_denominador`, `concentracao_polo_referencia_percentual`, `dispersao_fora_polo_referencia_percentual`, `situacao_evasao_no_score`, `evasao_hospitalar_normalizada_0_100` | resumo e card de evasão; sem leito local, o score usa dispersão fora do polo de referência |
| Risco | `populacao_total`, `populacao_alvo_proxy`, `valor_bruto_percentual`, `faixa_risco_populacional`, `risco_populacional_normalizado_0_100` | card de risco |
| Tendência | `populacao_alvo_2021`, `populacao_alvo_2025`, `variacao_absoluta_2021_2025`, `variacao_percentual_2021_2025`, `taxa_anual_composta_percentual`, `base_populacional_pequena`, `classificacao_tendencia`, `pontuacao_normalizada_tendencia` | card de tendência e auditoria |

## Pesos padrão v1

- Demanda residente: 30%.
- Déficit de oferta regional: 30%.
- Evasão intermunicipal observada: 15%.
- Tendência de crescimento da população-alvo: 15%.
- Risco populacional: 10%.

Os pesos são ajustáveis pelo simulador e ainda não foram validados por especialistas.

## Produção do artefato

No motor analítico, execute:

```powershell
.\.venv\Scripts\python.exe scripts\build_score_padrao_mvp_2025.py
.\.venv\Scripts\python.exe scripts\publish_prioriza_leitos_2025.py
```

O segundo comando gera `data/published/prioriza_leitos/2025/rankings.json`. A publicação no dashboard consiste em revisar o artefato e copiá-lo para `Prioriza-leitos/data/rankings.json`.

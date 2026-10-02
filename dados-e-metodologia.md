# Dados e metodologia publicados

Esta página descreve o conteúdo efetivamente consumido pela versão publicada do dashboard. O contrato completo está em [contrato-de-dados.md](contrato-de-dados.md).

## Fontes e período

| Informação | Fonte | Período publicado |
| --- | --- | --- |
| Internações de residentes e deslocamentos observados | SIH/SUS, DATASUS | janeiro a dezembro de 2025; recorte de estabelecimentos no RS |
| Leitos SUS e estabelecimentos | CNES, DATASUS | referência de 2025 |
| População-alvo e tendência | Ministério da Saúde / DATASUS | 2021 a 2025 |
| Regionalização | SES/RS | 2025 |
| Limites e sedes municipais | IBGE | malha 2022 e Localidades do Brasil — Censo 2022 |
| Tempo de rota | OpenRouteService | rotas de carro registradas no pipeline de 2025 |

## Registro analítico

Cada objeto em `data/rankings.json` representa um município, um ano e um tipo de leito. Os tipos ativos são `uti_adulto`, `obstetrico` e `pediatrico`.

| Grupo | Exemplos de campos |
| --- | --- |
| Identificação | `municipio_id`, `municipio_nome`, `tipo_leito`, `ano`, `regiao_saude` |
| Resultado | `score_padrao_0_100`, `posicao_relativa_por_tipo`, `faixa_prioridade` |
| Demanda | `internacoes_residentes`, `populacao_alvo`, `demanda_residente_taxa_por_1000_pop_alvo` |
| Cobertura | `leitos_sus_locais_registrados`, `polo_municipio_id`, `populacao_alvo_regional`, `pressao_regional_por_leito`, `duracao_rota_horas` |
| Evasão | `evasao_hospitalar_percentual`, `concentracao_polo_referencia_percentual`, `dispersao_ponderada_deslocamento_normalizada_0_100` |
| Risco e tendência | `risco_populacional_normalizado_0_100`, `taxa_anual_composta_percentual`, `pontuacao_normalizada_tendencia` |

## Interpretação

O score compara municípios do mesmo tipo de leito. Ele é uma prioridade relativa para investigação e possível investimento, sem medir ocupação, vaga disponível, regulação, fluxo completo de pacientes ou viabilidade de implantação.

Quando não há leito SUS local, a saída do município é esperada. Nesse caso, a evasão no score usa a dispersão além do polo de referência, ponderada pelo deslocamento adicional; somente destinos observados em até três horas participam da pontuação. A concentração no polo permanece um contexto explicativo.

Consulte [como-o-score-e-calculado.html](como-o-score-e-calculado.html) para a explicação visual e exemplos fictícios.

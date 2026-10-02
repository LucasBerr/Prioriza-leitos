# Prioriza Leitos

Dashboard estático para explorar prioridades relativas de investigação de necessidade hospitalar nos 497 municípios do Rio Grande do Sul.

O MVP usa regras transparentes, dados públicos e pesos ajustáveis. Ele apoia investigação e planejamento especializado; não recomenda automaticamente a abertura de leitos e não utiliza Machine Learning.

## Escopo publicado

- Referência: 2025.
- Tipos ativos: UTI adulto, leitos obstétricos e leitos pediátricos.
- Unidade analisada: município de residência + ano + tipo de leito.
- Registros publicados: 1.491, equivalentes a 497 municípios × 3 tipos.

Leitos clínicos e cirúrgicos estão fora do escopo ativo. As páginas históricas desses tipos apenas preservam links antigos e não ativam filtros do MVP.

## Componentes do score

O score final é a soma ponderada de cinco componentes normalizados de 0 a 100:

| Componente | Peso padrão |
| --- | ---: |
| Demanda residente | 30% |
| Déficit de oferta regional estimado | 30% |
| Evasão intermunicipal observada ou dispersão ponderada fora do polo | 15% |
| Tendência de crescimento da população-alvo | 15% |
| Risco populacional | 10% |

Os pesos podem ser simulados no navegador e não foram validados por especialistas. Consulte [como-o-score-e-calculado.html](como-o-score-e-calculado.html) para fontes, fórmulas e exemplos ilustrativos.

## Dados e execução

O navegador carrega arquivos estáticos; não há backend nem etapa de build. O contrato publicado é [data/rankings.json](data/rankings.json), documentado em [contrato-de-dados.md](contrato-de-dados.md).

Para executar localmente:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000/`. O dashboard precisa ser servido por HTTP porque os dados são carregados com `fetch()`.

## Estrutura

```text
index.html                         mapa, filtros e pop-up municipal
entenda-o-score.html               simulador de pesos
como-o-score-e-calculado.html      explicação visual do score
assets/                            estilos e JavaScript
data/rankings.json                 contrato analítico publicado
data/municipios_limites.geojson    malha municipal usada na cobertura regional
```

O motor analítico é um repositório independente. A atualização deste dashboard é uma publicação manual do JSON revisado; não existe sincronização em tempo de execução.

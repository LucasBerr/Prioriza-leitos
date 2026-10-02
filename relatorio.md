# Relatório da publicação 2025

## O que esta versão entrega

O Prioriza Leitos apresenta um ranking relativo por município e tipo de leito, com mapa, filtros, explicação dos componentes e simulador de pesos. A referência publicada é 2025 e cobre todos os 497 municípios do Rio Grande do Sul.

O escopo ativo contém UTI adulto, leitos obstétricos e leitos pediátricos. Leitos clínicos e cirúrgicos não participam do ranking atual.

## Metodologia publicada

O score usa cinco sinais normalizados e pesos padrão de 30%, 30%, 15%, 15% e 10% para demanda residente, déficit regional estimado, evasão/dispersão, tendência da população-alvo e risco populacional, respectivamente.

A cobertura regional é uma estimativa baseada em oferta SUS registrada, população-alvo associada e rota até uma oferta de referência. Ela não equivale a ocupação, capacidade disponível, regulação ou fluxo real.

A evasão observa internações de residentes atendidas em outro município no recorte SIH-RS. Para municípios sem oferta local, o score considera a dispersão fora do polo de referência ponderada pelo deslocamento adicional, com destino máximo elegível de três horas. Essa informação apoia investigação e não comprova falha do polo.

## Limitações

- O score é baseado em regras; não é previsão, recomendação clínica nem decisão automática de implantação.
- Os pesos são editáveis e ainda não foram validados por especialistas.
- O recorte de evasão utiliza estabelecimentos registrados no Rio Grande do Sul; não representa internações de residentes gaúchos em outros estados.
- Tempos de rota e polos são aproximações documentadas pelo pipeline analítico.

## Referências internas

- [contrato-de-dados.md](contrato-de-dados.md): esquema e produção do JSON.
- [dados-e-metodologia.md](dados-e-metodologia.md): fontes e interpretação.
- [como-o-score-e-calculado.html](como-o-score-e-calculado.html): explicação visual do cálculo.

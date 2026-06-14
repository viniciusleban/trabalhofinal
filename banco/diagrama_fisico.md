# Banco de Dados — G8 Farmácia

Módulo de Farmácia do Sistema de Saúde Integrado. Banco relacional em PostgreSQL.

## Arquivos

- `01_schema.sql` — criação das tabelas, chaves, constraints e índices
- `02_view_proc_trigger.sql` — view, stored procedure e trigger
- `03_seed.sql` — dados de exemplo para teste
- `diagrama_fisico.md` — diagrama físico (ER)

## Ordem de execução

```
psql -U postgres -d farmacia_g8 -f 01_schema.sql
psql -U postgres -d farmacia_g8 -f 02_view_proc_trigger.sql
psql -U postgres -d farmacia_g8 -f 03_seed.sql
```

## Diagrama Físico

```mermaid
erDiagram
    USUARIO {
        serial id_usuario PK
        varchar nome
        varchar email UK
        varchar senha_hash
        varchar papel
        boolean ativo
        timestamp criado_em
    }

    MEDICAMENTO {
        serial id_medicamento PK
        varchar nome_comercial
        varchar principio_ativo
        varchar forma_farmaceutica
        varchar concentracao
        varchar unidade_medida
        numeric preco_unitario
        integer estoque_atual
        boolean ativo
        timestamp criado_em
    }

    DISPENSACAO {
        serial id_dispensacao PK
        integer id_receita_externa
        integer id_paciente_externo
        integer id_usuario FK
        timestamp data_dispensacao
        varchar status
        numeric valor_total
        varchar observacao
    }

    ITEM_DISPENSACAO {
        serial id_item PK
        integer id_dispensacao FK
        integer id_medicamento FK
        integer quantidade
        varchar dosagem
        numeric preco_unitario
        numeric subtotal
    }

    LOG_AUDITORIA {
        serial id_log PK
        integer id_dispensacao FK
        integer id_usuario FK
        varchar operacao
        varchar resultado
        timestamp data_evento
        varchar detalhe
    }

    USUARIO ||--o{ DISPENSACAO : "realiza"
    DISPENSACAO ||--o{ ITEM_DISPENSACAO : "contem"
    MEDICAMENTO ||--o{ ITEM_DISPENSACAO : "referenciado_por"
    DISPENSACAO ||--o{ LOG_AUDITORIA : "gera"
    USUARIO ||--o{ LOG_AUDITORIA : "executa"
```

## Decisões de modelagem

As receitas (G6) e pacientes (G1) pertencem a outros módulos. Por isso o banco guarda
apenas `id_receita_externa` e `id_paciente_externo` como referências numéricas, sem
chave estrangeira local — os dados completos são buscados via API. Isso também atende
à LGPD, já que dados pessoais não ficam duplicados aqui.

A normalização separa `dispensacao` (cabeçalho) de `item_dispensacao` (itens), evitando
repetição de dados e permitindo várias linhas de medicamento por dispensação (3FN).

## View

`vw_historico_dispensacao` junta dispensação, usuário, item e medicamento numa
consulta única, usada pela tela de histórico e pela auditoria.

## Stored Procedure

`sp_registrar_dispensacao` insere a dispensação e seu item dentro de uma única
transação, calcula o subtotal e grava o log. Se o medicamento não existir, lança erro
e desfaz tudo.

## Trigger

`tg_baixa_estoque` dispara após inserir um item e desconta a quantidade do estoque do
medicamento, barrando a operação se não houver saldo. Mantém o estoque sempre
consistente, independente de quem inseriu o item.

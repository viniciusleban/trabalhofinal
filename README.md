# G8 — Módulo Farmácia

Módulo de Farmácia do Sistema de Saúde Integrado (Projeto Integrador 2026).
Responsável por validar receitas, registrar a dispensação de medicamentos e
fornecer os dados ao módulo de Faturamento.

## Integrantes

- Gabriel Sartori
- Pedro Tormem
- Vinicius Leban

## Stack

- Back-end: Node.js + Express
- Front-end: React + Vite
- Banco de dados: PostgreSQL

## Integrações

- Consome do grupo G6 (Receitas Médicas): valida receitas antes da dispensação.
- Fornece ao grupo G10 (Faturamento): expõe os dados das dispensações para cobrança.

## Estrutura

```
artefatos/   Diagramas de Classes, Sequência, Casos de Uso e Diagrama ER do Banco de Dados
backend/     API REST (Express)
frontend/    Interface web (React)
banco/       Scripts SQL (schema, view, procedure, trigger, seed)
```

## Como rodar localmente

### 1. Banco de dados

Crie o banco e rode os scripts na ordem:

```
createdb farmacia_g8
psql -d farmacia_g8 -f banco/01_schema.sql
psql -d farmacia_g8 -f banco/02_view_proc_trigger.sql
psql -d farmacia_g8 -f banco/03_seed.sql
```

As senhas do seed usam hash bcrypt. Para gerar um hash real:

```
cd backend
npm install
node gerar-hash.js suaSenha
```

Copie o hash gerado para o campo `senha_hash` no `03_seed.sql`.

### 2. Back-end

```
cd backend
cp .env.example .env      # ajuste as credenciais
npm install
npm run dev
```

A API sobe em `http://localhost:3008`.

### 3. Front-end

```
cd frontend
cp .env.example .env
npm install
npm run dev
```

A interface sobe em `http://localhost:5173`.

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/login | Autenticação, retorna token JWT |
| GET | /api/receitas/:id/validar | Valida receita no G6 |
| POST | /api/dispensacoes | Registra dispensação |
| GET | /api/dispensacoes | Lista/filtra dispensações (paginado) |
| GET | /api/dispensacoes/:id | Detalha uma dispensação |
| PATCH | /api/dispensacoes/:id/faturar | Marca como faturada (uso do G10) |
| GET | /api/medicamentos | Lista medicamentos |
| POST | /api/medicamentos | Cadastra medicamento |

Todas as rotas, exceto `/login` e criação de usuário, exigem o cabeçalho
`Authorization: Bearer <token>`.

## Observação sobre a integração com o G6

O cliente do G6 (`backend/src/services/g6Service.js`) tenta autenticar via
`POST /login` e buscar a receita via `GET /receitas/:id`. Como o formato exato
do JSON pode variar, a função `normalizarReceita` mapeia os nomes de campo mais
prováveis (id, pacienteId, status). Ao testar com o G6 real, confira o JSON que
ele devolve e ajuste o mapeamento nesse único ponto, se necessário.

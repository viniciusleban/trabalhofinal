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
- Autenticação: JWT

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

A API sobe em `http://localhost:3001`.

### 3. Front-end

```
cd frontend
cp .env.example .env
npm install
npm run dev
```

A interface sobe em `http://localhost:5173`.

## Documentação da API

A documentação dos endpoints está disponível na seção [Endpoints principais](#endpoints-principais) abaixo.

Todas as rotas, exceto `/api/login`, exigem o cabeçalho:

```
Authorization: Bearer <token>
```

O token é obtido via `POST /api/login` e expira em 8 horas.

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

## Observação sobre a integração com o G6

O cliente do G6 (`backend/src/services/g6Service.js`) autentica via `POST /login`
e busca a receita via `GET /receita/validar/:id`. Após a dispensação, notifica o G6
via `POST /receita/dispensar/:id`. Caso o módulo G6 esteja indisponível, o sistema
retorna HTTP 503 com mensagem clara ao usuário.

## Contatos

| Nome | E-mail |
|------|--------|
| Vinicius Leban | vinicius.leban@unoesc.edu.br |
| Pedro Tormem | gabrielsartori2928@gmail.com |
| Gabriel Sartori | pedrotormem29@gmail.com |

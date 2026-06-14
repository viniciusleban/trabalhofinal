import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', modulo: 'G8-Farmacia' }));

app.use('/api', router);

app.use((req, res) => res.status(404).json({ erro: 'Rota nao encontrada' }));

app.use((erro, req, res, next) => {
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3008;

app.listen(PORT, () => {
  console.log(`Modulo G8 Farmacia rodando na porta ${PORT}`);
});

export default app;

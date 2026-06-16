import { Router } from 'express';
import { login, registrar } from '../controllers/authController.js';
import * as medicamento from '../controllers/medicamentoController.js';
import * as dispensacao from '../controllers/dispensacaoController.js';
import { autenticarToken, exigirPapel } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/usuarios', registrar);

router.get('/medicamentos', autenticarToken, medicamento.listar);
router.get('/medicamentos/:id', autenticarToken, medicamento.buscarPorId);
router.post('/medicamentos', autenticarToken, exigirPapel('farmaceutico', 'admin'), medicamento.criar);
router.patch('/medicamentos/:id/estoque', autenticarToken, exigirPapel('farmaceutico', 'admin'), medicamento.atualizarEstoque);

router.get('/receitas/:idReceita/validar', autenticarToken, dispensacao.validarReceita);
router.get('/receitas', autenticarToken, dispensacao.listarReceitasG6);

router.post('/dispensacoes', autenticarToken, exigirPapel('farmaceutico', 'admin'), dispensacao.registrarDispensacao);
router.get('/dispensacoes', autenticarToken, dispensacao.listarDispensacoes);
router.get('/dispensacoes/:id', autenticarToken, dispensacao.detalharDispensacao);
router.patch('/dispensacoes/:id/faturar', autenticarToken, dispensacao.marcarFaturado);

router.patch('/medicamentos/:id', autenticarToken, exigirPapel('farmaceutico', 'admin'), medicamento.atualizar);
router.delete('/medicamentos/:id', autenticarToken, exigirPapel('farmaceutico', 'admin'), medicamento.excluir);

export default router;

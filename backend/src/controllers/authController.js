import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { query } from '../db.js';

dotenv.config();

export async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha sao obrigatorios' });
  }

  const resultado = await query(
    'SELECT id_usuario, nome, email, senha_hash, papel, ativo FROM usuario WHERE email = $1',
    [email]
  );

  if (resultado.rowCount === 0) {
    return res.status(401).json({ erro: 'Credenciais invalidas' });
  }

  const usuario = resultado.rows[0];

  if (!usuario.ativo) {
    return res.status(403).json({ erro: 'Usuario inativo' });
  }

  const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);

  if (!senhaConfere) {
    return res.status(401).json({ erro: 'Credenciais invalidas' });
  }

  const token = jwt.sign(
    { id: usuario.id_usuario, nome: usuario.nome, papel: usuario.papel },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return res.json({
    token,
    usuario: { id: usuario.id_usuario, nome: usuario.nome, papel: usuario.papel }
  });
}

export async function registrar(req, res) {
  const { nome, email, senha, papel } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha sao obrigatorios' });
  }

  const existente = await query('SELECT id_usuario FROM usuario WHERE email = $1', [email]);

  if (existente.rowCount > 0) {
    return res.status(409).json({ erro: 'Email ja cadastrado' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const resultado = await query(
    'INSERT INTO usuario (nome, email, senha_hash, papel) VALUES ($1, $2, $3, $4) RETURNING id_usuario, nome, email, papel',
    [nome, email, senhaHash, papel || 'farmaceutico']
  );

  return res.status(201).json(resultado.rows[0]);
}

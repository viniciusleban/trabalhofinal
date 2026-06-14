import bcrypt from 'bcryptjs';

const senha = process.argv[2] || 'senha123';
const hash = bcrypt.hashSync(senha, 10);

console.log('Senha:', senha);
console.log('Hash: ', hash);

const pool = require('./connection');

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conexão OK', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Erro na conexão', err);
    process.exit(1);
  }
})();

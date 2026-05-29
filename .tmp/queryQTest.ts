(async ()=>{
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  await db.exec('CREATE TABLE IF NOT EXISTS t_qtest (id TEXT PRIMARY KEY)');
  await db.exec("INSERT INTO t_qtest VALUES ('x')");
  const sql = 'SELECT * FROM t_qtest WHERE id = ?';
  const params = ['x'];
  try {
    const res = await db.query(sql, params);
    console.log('RESULT', JSON.stringify(res));
  } catch (e) {
    console.error('ERROR', e);
    process.exitCode = 1;
  }
})();

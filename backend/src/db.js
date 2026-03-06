import pkg from "pg";
const { Pool } = pkg;

// ⚠️ MODO DESARROLLO LOCAL - Cambiar para producción
const USE_LOCAL_DB = false; // true = localhost, false = Google Cloud

console.log(`🔍 Modo: ${USE_LOCAL_DB ? "LOCAL" : "GOOGLE CLOUD SQL"}`);

const pool = new Pool(USE_LOCAL_DB ? {
  // Configuración LOCAL (desarrollo)
  user: "postgres",
  host: "localhost",
  database: "guardian",
  password: "postgres",
  port: 5432,
} : {
  // Configuración GOOGLE CLOUD
  user: "",
  host: "",
  database: "",
  password: "",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
});

// Test de conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('\n❌ Error de conexión:', err.message);
    
    if (USE_LOCAL_DB) {
      console.error('💡 Asegúrate de que PostgreSQL esté corriendo localmente');
    } else {
      console.error('💡 Verifica:');
      console.error('   1. Google Cloud Console → SQL → Connections');
      console.error('   2. Public IP: Enabled');
      console.error('   3. Authorized networks contiene: 0.0.0.0/0');
      console.error('   4. Click SAVE y espera 1 minuto');
      console.error('');
      console.error('   O cambia USE_LOCAL_DB = true para desarrollo local');
    }
    console.error('');
  } else {
    console.log(`\n✅ CONECTADO a ${USE_LOCAL_DB ? "PostgreSQL local" : "Google Cloud SQL"}\n`);
    release();
  }
});

export default pool;
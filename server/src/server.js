const app = require('./app');
const { initStore } = require('./db/adapter');

const PORT = process.env.PORT || 3001;

async function startServer() {
  await initStore();
  
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

startServer();
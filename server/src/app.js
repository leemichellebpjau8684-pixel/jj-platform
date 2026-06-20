const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');

app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;
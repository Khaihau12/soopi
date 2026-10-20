const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('node:path');
const apiRoutes = require('./src/routes');
const { taoLoi } = require('./src/utils/taoLoi');
const xuLyLoi = require('./src/middlewares/error.middleware');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));
app.use('/api', apiRoutes);

app.use((req, res, next) => {
  next(taoLoi(404, 'Không tìm thấy đường dẫn'));
});

app.use(xuLyLoi);

module.exports = app;

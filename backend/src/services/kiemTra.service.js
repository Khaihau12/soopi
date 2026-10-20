const mongoose = require('mongoose');

const layTrangThaiHeThong = () => ({
  coSoDuLieu: mongoose.connection.readyState === 1 ? 'Đã kết nối' : 'Chưa kết nối',
});

module.exports = { layTrangThaiHeThong };

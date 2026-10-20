const mongoose = require('mongoose');

const ketNoiCoSoDuLieu = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  console.info('Đã kết nối MongoDB.');
};

module.exports = { ketNoiCoSoDuLieu };

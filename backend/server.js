require('dotenv').config();

const tenBienBatBuoc = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'];
const bienConThieu = tenBienBatBuoc.filter((tenBien) => !process.env[tenBien]?.trim());

if (bienConThieu.length > 0) {
  console.error('Thiếu biến môi trường: ' + bienConThieu.join(', '));
  process.exit(1);
}

const app = require('./app');
const http = require('node:http');
const { khoiTaoSocket } = require('./src/services/thongBaoTinNhan.service');
const { quetAnhKhongDung } = require('./src/services/anhCloudinary.service');
const { ketNoiCoSoDuLieu } = require('./src/config/database');
const { xuLyGiaoDichHetHan } = require('./src/services/giaoDichThanhToan.service');
const { CHU_KY_QUET_HET_HAN_PHUT } = require('./src/constants/cauHinh.constant');

let dangQuetHetHan = false;
let dangQuetAnh = false;
const quetGiaoDichHetHan = async () => {
  if (dangQuetHetHan) return;
  dangQuetHetHan = true;
  try { await xuLyGiaoDichHetHan(); }
  catch (loi) { console.error('Không thể quét giao dịch VNPay hết hạn:', loi); }
  finally { dangQuetHetHan = false; }
};

const khoiDong = async () => {
  try {
    await ketNoiCoSoDuLieu();
    const httpServer = http.createServer(app);
    khoiTaoSocket(httpServer);
    httpServer.listen(process.env.PORT, () => {
      console.log('Soopi API đang chạy ở cổng ' + process.env.PORT);
    });
    void quetGiaoDichHetHan();
    setInterval(quetGiaoDichHetHan, CHU_KY_QUET_HET_HAN_PHUT * 60000);
    const quetAnh = async () => {
      if (dangQuetAnh) return;
      dangQuetAnh = true;
      try { await quetAnhKhongDung(); }
      catch (loi) { console.error('Không thể quét ảnh Cloudinary:', loi.message); }
      finally { dangQuetAnh = false; }
    };
    void quetAnh();
    setInterval(quetAnh, 24 * 60 * 60 * 1000);
  } catch (loi) {
    console.error('Không thể khởi động Soopi API vì kết nối MongoDB thất bại.');
    process.exit(1);
  }
};

khoiDong();

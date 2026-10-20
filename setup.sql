// Soopi - script thiết lập MongoDB (JavaScript cho mongosh, không phải SQL).
// Chạy: mongosh "mongodb://127.0.0.1:27017" --file setup.sql
// Chạy lại an toàn: chỉ tạo collection còn thiếu; createIndex không tạo trùng index cùng định nghĩa.
// Không chèn dữ liệu mẫu và không xóa dữ liệu hiện có.
// Sao lưu: mongodump --uri="mongodb://127.0.0.1:27017/soopi" --archive=soopi.archive --gzip
// Khôi phục: mongorestore --uri="mongodb://127.0.0.1:27017" --archive=soopi.archive --gzip
// Lưu ý: mongodump/mongorestore thuộc MongoDB Database Tools, cần cài riêng nếu chưa có.

const soopi = db.getSiblingDB('soopi');
const collections = [
  'TaiKhoan', 'YeuCauDangKyNguoiBan', 'CuaHang', 'DanhMuc', 'SanPham',
  'KhuyenMai', 'ChiTietKhuyenMai', 'Voucher', 'ApDungVoucher',
  'BannerQuangCao', 'GioHang', 'ChiTietGioHang', 'DonHang',
  'ChiTietDonHang', 'GiaoDichThanhToan', 'DanhGia',
  'YeuCauDoiTraKhieuNai', 'CuocTroChuyen', 'TinNhan'
];

const existing = new Set(soopi.getCollectionNames());
for (const name of collections) {
  if (!existing.has(name)) soopi.createCollection(name);
}

// _id là khóa chính MongoDB; các idXxx trong tài liệu ánh xạ vào _id.
// Các trường tham chiếu xxxId sẽ lưu ObjectId khi ứng dụng ghi dữ liệu.
// Chỉ mục theo Bảng 3.45 của tài liệu thiết kế.
soopi.TaiKhoan.createIndex({ email: 1 }, { unique: true });
soopi.CuaHang.createIndex({ taiKhoanId: 1 }, { unique: true });
soopi.SanPham.createIndex({ cuaHangId: 1 });
soopi.SanPham.createIndex({ danhMucId: 1 });
soopi.SanPham.createIndex({ tenSanPham: 'text' });
soopi.ChiTietKhuyenMai.createIndex({ khuyenMaiId: 1, sanPhamId: 1 });
soopi.Voucher.createIndex({ maVoucher: 1 }, { unique: true });
soopi.ApDungVoucher.createIndex({ donHangId: 1 });
soopi.GioHang.createIndex({ taiKhoanId: 1 }, { unique: true });
soopi.ChiTietGioHang.createIndex({ gioHangId: 1, sanPhamId: 1 }, { unique: true });
soopi.DonHang.createIndex({ taiKhoanId: 1, ngayTao: 1 });
soopi.DonHang.createIndex({ cuaHangId: 1, ngayTao: 1 });
soopi.DonHang.createIndex({ giaoDichId: 1 });
soopi.ChiTietDonHang.createIndex({ donHangId: 1 });
soopi.ChiTietDonHang.createIndex({ sanPhamId: 1 });
soopi.GiaoDichThanhToan.createIndex({ maGiaoDich: 1 }, { unique: true });
soopi.DanhGia.createIndex({ chiTietDonHangId: 1 }, { unique: true });
soopi.DanhGia.createIndex({ sanPhamId: 1 });
soopi.YeuCauDoiTraKhieuNai.createIndex({ chiTietDonHangId: 1 }, { unique: true });
soopi.CuocTroChuyen.createIndex({ taiKhoanId: 1, cuaHangId: 1 });
soopi.TinNhan.createIndex({ cuocTroChuyenId: 1, thoiGianGui: 1 });

print(`Đã thiết lập ${collections.length} collection trong cơ sở dữ liệu soopi.`);

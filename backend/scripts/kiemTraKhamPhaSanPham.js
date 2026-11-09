const assert = require('node:assert/strict');
const mongoose = require('mongoose');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const KhuyenMai = require('../src/models/khuyenMai.model');
const ChiTietKhuyenMai = require('../src/models/chiTietKhuyenMai.model');
const DanhGia = require('../src/models/danhGia.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_kham_pha_kiem_tra_${Date.now()}`;
let server;
const goi = async (duongDan) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`);
  return [response.status, await response.json()];
};

async function run() {
  await mongoose.connect(uri.toString());
  await SanPham.init();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const chuA = await TaiKhoan.create({ email: 'kham-pha-a@example.com', matKhau: 'hash-mau', hoTen: 'Người bán A' });
  const chuB = await TaiKhoan.create({ email: 'kham-pha-b@example.com', matKhau: 'hash-mau', hoTen: 'Người bán B' });
  const mua = await TaiKhoan.create({ email: 'kham-pha-mua@example.com', matKhau: 'hash-mau', hoTen: 'Người mua' });
  const shopA = await CuaHang.create({ taiKhoanId: chuA._id, tenCuaHang: 'Bếp A', moTa: 'Đồ gia dụng', diaChi: 'Hà Nội' });
  const shopB = await CuaHang.create({ taiKhoanId: chuB._id, tenCuaHang: 'Bếp B', trangThaiHoatDong: 'Ngừng hoạt động' });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Đồ bếp' });
  const re = await SanPham.create({ tenSanPham: 'Chảo giá gốc cao', giaGoc: 100000, soLuongTon: 3, cuaHangId: shopA._id, danhMucId: danhMuc._id });
  const dat = await SanPham.create({ tenSanPham: 'Nồi giá gốc thấp', giaGoc: 80000, soLuongTon: 3, cuaHangId: shopA._id, danhMucId: danhMuc._id });
  const ngungBan = await SanPham.create({ tenSanPham: 'Thớt cũ', giaGoc: 50000, soLuongTon: 0, cuaHangId: shopA._id, danhMucId: danhMuc._id, trangThaiKinhDoanh: 'Ngừng kinh doanh' });
  await SanPham.create({ tenSanPham: 'Ấm cửa hàng tắt', giaGoc: 20000, soLuongTon: 1, cuaHangId: shopB._id, danhMucId: danhMuc._id });
  const chuongTrinh = await KhuyenMai.create({ tenKhuyenMai: 'Giảm giá chảo', loaiKhuyenMai: 'Giảm giá', phamVi: 'Cửa hàng',
    ngayBatDau: new Date(Date.now() - 60000), ngayKetThuc: new Date(Date.now() + 3600000), trangThai: 'Đang hoạt động', cuaHangId: shopA._id });
  await ChiTietKhuyenMai.create({ khuyenMaiId: chuongTrinh._id, sanPhamId: re._id, giaKhuyenMai: 60000 });
  for (const [sanPham, soSao] of [[re, 5], [dat, 3], [ngungBan, 1]]) {
    await DanhGia.create({ sanPhamId: sanPham._id, taiKhoanId: mua._id, chiTietDonHangId: new mongoose.Types.ObjectId(),
      soSao, noiDung: `Đánh giá ${soSao} sao` });
  }

  const [maShop, shop] = await goi(`/cua-hang/${shopA._id}`);
  assert.equal(maShop, 200);
  assert.equal(shop.data.cuaHang.tenCuaHang, 'Bếp A');
  assert.equal(shop.data.soSanPham, 2);
  assert.equal(shop.data.thongKeDanhGia.soDanhGia, 3);
  assert.equal((await goi('/cua-hang'))[1].data.danhSach.length, 1);
  assert.equal((await goi(`/cua-hang/${shopB._id}`))[0], 404);
  assert.equal((await goi(`/cua-hang/${shopA._id}/danh-gia?gioiHan=2`))[1].data.phanTrang.tongTrang, 2);

  const [maGia, locGia] = await goi('/san-pham?giaDen=65000');
  assert.equal(maGia, 200);
  assert.deepEqual(locGia.data.danhSach.map((item) => String(item._id)), [String(re._id)]);
  assert.equal(locGia.data.danhSach[0].giaBanThucTe, 60000);
  assert.equal(locGia.data.danhSach[0].khuyenMaiApDung.tenKhuyenMai, 'Giảm giá chảo');
  assert.deepEqual(locGia.data.cuaHangLienQuan, [{ _id: String(shopA._id), soSanPham: 1 }]);
  assert.deepEqual(locGia.data.danhMucLienQuan, [{ _id: String(danhMuc._id), soSanPham: 1 }]);
  const sapXep = (await goi('/san-pham?sapXep=gia-tang')).at(1).data;
  assert.deepEqual(sapXep.danhSach.map((item) => String(item._id)), [String(re._id), String(dat._id)]);
  const theoShop = (await goi(`/san-pham?cuaHangId=${shopA._id}&soSaoToiThieu=4`)).at(1).data;
  assert.equal(theoShop.phanTrang.tongSo, 1);
  assert.equal(theoShop.danhSach[0].thongKeDanhGia.diemTrungBinh, 5);
  assert.equal((await goi(`/san-pham?cuaHangId=${shopB._id}`))[1].data.phanTrang.tongSo, 0);
  assert.equal((await goi('/san-pham?sapXep=gia-giam&gioiHan=1&trang=2'))[1].data.danhSach[0]._id, String(re._id));
  assert.equal((await goi('/san-pham?giaTu=100000&giaDen=20000'))[0], 400);
  assert.equal((await goi('/san-pham?soSaoToiThieu=6'))[0], 400);
  assert.equal((await goi('/san-pham?sapXep=khong-hop-le'))[0], 400);
  const shopKhac = await CuaHang.create({ taiKhoanId: mua._id, tenCuaHang: 'Nhà Bếp C', moTa: 'Đồ bếp', diaChi: 'Hà Nội' });
  const danhMucKhac = await DanhMuc.create({ tenDanhMuc: 'Bình giữ nhiệt' });
  await SanPham.create({ tenSanPham: 'Bình giữ giá', giaGoc: 40000, soLuongTon: 2, cuaHangId: shopKhac._id, danhMucId: danhMucKhac._id });
  const ketQuaTheoShop = (await goi(`/san-pham?tuKhoa=giá&cuaHangId=${shopA._id}`)).at(1).data;
  assert.equal(ketQuaTheoShop.phanTrang.tongSo, 2);
  assert.deepEqual(new Set(ketQuaTheoShop.cuaHangLienQuan.map((item) => item._id)),
    new Set([String(shopA._id), String(shopKhac._id)]));
  assert.deepEqual(ketQuaTheoShop.danhMucLienQuan, [{ _id: String(danhMuc._id), soSanPham: 2 }]);
  const ketQuaTheoDanhMuc = (await goi(`/san-pham?tuKhoa=giá&danhMucId=${danhMuc._id}`)).at(1).data;
  assert.equal(ketQuaTheoDanhMuc.phanTrang.tongSo, 2);
  assert.deepEqual(new Set(ketQuaTheoDanhMuc.danhMucLienQuan.map((item) => item._id)),
    new Set([String(danhMuc._id), String(danhMucKhac._id)]));
  const taiNghe = await SanPham.create({ tenSanPham: 'Tai nghe có dây', giaGoc: 90000, cuaHangId: shopA._id, danhMucId: danhMuc._id });
  const botNghe = await SanPham.create({ tenSanPham: 'Tinh bột nghệ', giaGoc: 70000, cuaHangId: shopA._id, danhMucId: danhMuc._id });
  const congNghe = await SanPham.create({ tenSanPham: 'Đồ công nghệ thông minh', giaGoc: 150000, cuaHangId: shopA._id, danhMucId: danhMuc._id });
  await SanPham.create({ tenSanPham: 'Kẹp tài liệu', giaGoc: 30000, cuaHangId: shopA._id, danhMucId: danhMuc._id });
  const dienThoai = await SanPham.create({ tenSanPham: 'Ốp điện thoại', giaGoc: 50000, cuaHangId: shopA._id, danhMucId: danhMuc._id });
  const timIds = async (tuKhoa) => new Set((await goi(`/san-pham?tuKhoa=${encodeURIComponent(tuKhoa)}`)).at(1)
    .data.danhSach.map((item) => String(item._id)));
  assert.deepEqual(await timIds('nghệ'), new Set([String(botNghe._id), String(congNghe._id)]));
  assert.deepEqual(await timIds('nghề'), new Set());
  assert.deepEqual(await timIds('tai nghe'), new Set([String(taiNghe._id)]));
  assert.deepEqual(await timIds('công nghệ'), new Set([String(congNghe._id)]));
  assert.deepEqual(await timIds('dien'), new Set([String(dienThoai._id)]));
  assert.deepEqual(await timIds('nghe'), new Set([String(taiNghe._id), String(botNghe._id), String(congNghe._id)]));
  const hetHang = await SanPham.create({ tenSanPham: 'Chảo tạm hết hàng', giaGoc: 50000, soLuongTon: 0,
    cuaHangId: shopA._id, danhMucId: danhMuc._id });
  const tatCaChao = (await goi('/san-pham?tuKhoa=chảo')).at(1).data;
  const conHangChao = (await goi('/san-pham?tuKhoa=chảo&conHang=true&gioiHan=1')).at(1).data;
  assert.ok(tatCaChao.danhSach.some((item) => item._id === String(hetHang._id)));
  assert.equal(conHangChao.phanTrang.tongSo, 1);
  assert.equal(conHangChao.phanTrang.tongTrang, 1);
  assert.equal(conHangChao.danhSach[0]._id, String(re._id));
  assert.equal(conHangChao.danhMucLienQuan[0].soSanPham, 1);
  assert.equal((await goi('/san-pham?conHang=khong'))[0], 400);
  console.log('Khám phá sản phẩm: tìm kiếm tiếng Việt, cửa hàng, giá khuyến mãi, lọc, sắp xếp và phân trang đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});

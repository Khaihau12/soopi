// Dữ liệu học tập Soopi. Chạy: mongosh mongodb://127.0.0.1:27017/soopi --file seed-soopi.mongosh.js
// ID mẫu dạng String chỉ dùng nội bộ khi dựng dữ liệu; trước khi insert sẽ đổi đồng bộ sang ObjectId.
// Hash bcrypt 10 rounds cho mật khẩu demo SoopiDemo!2026; không lưu mật khẩu thuần trong DB.
// Ngày cố định quanh 11/10/2026 để minh họa; mã DEMO không phải giao dịch VNPay thật.
// Quy ước demo: phí giao hàng mô phỏng 20.000đ/đơn; tối đa một voucher mỗi loại/đơn.
const d = db.getSiblingDB('soopi');
if (db.getName() !== 'soopi') throw new Error('Chỉ chạy với URI trỏ trực tiếp database soopi.');
const names = ['TaiKhoan','YeuCauDangKyNguoiBan','CuaHang','DanhMuc','SanPham','KhuyenMai','ChiTietKhuyenMai','Voucher','ApDungVoucher','BannerQuangCao','GioHang','ChiTietGioHang','DonHang','ChiTietDonHang','GiaoDichThanhToan','DanhGia','YeuCauDoiTraKhieuNai','CuocTroChuyen','TinNhan'];
const existing = d.getCollectionNames();
if (names.some(n => !existing.includes(n))) throw new Error('Thiếu Collection: ' + names.filter(n => !existing.includes(n)).join(', '));
// Đọc các index đang có; không tạo/sửa index trong script seed.
const uniqueIndexes = {
  TaiKhoan: ['email'], CuaHang: ['taiKhoanId'], Voucher: ['maVoucher'],
  GioHang: ['taiKhoanId'], ChiTietGioHang: ['gioHangId,sanPhamId'],
  GiaoDichThanhToan: ['maGiaoDich'], DanhGia: ['chiTietDonHangId'],
  YeuCauDoiTraKhieuNai: ['chiTietDonHangId']
};
for (const [name, keys] of Object.entries(uniqueIndexes)) {
  const indexes = d.getCollection(name).getIndexes();
  for (const key of keys) {
    if (!indexes.some(i => i.unique && Object.keys(i.key).join(',') === key)) {
      throw new Error(`${name}: thiếu unique index ${key}`);
    }
  }
}
const date = s => new Date(s + 'T00:00:00.000Z');
const at = s => new Date(s + 'Z');
const id = (prefix, n) => `${prefix}${String(n).padStart(3,'0')}`;
const hash = '$2b$10$Qo/nfhyHR3DdXW//zcWRsOocfzlnp9RpOgkjEIBslS2O.lkCuvHMu';
const data = Object.fromEntries(names.map(n => [n, []]));
const add = (name, doc) => data[name].push(doc);
const byId = (name, key) => data[name].find(x => x._id === key);

// 4 Người bán được duyệt, 6 Người dùng, 1 quản trị, 1 tài khoản bị khóa.
const people = ['An Bình','Bảo Châu','Cẩm Dung','Đức Huy','Gia Hân','Hải Long','Khánh Linh','Minh Quân','Ngọc Mai','Phúc Nam','Quỳnh Anh','Tuấn Khoa'];
people.forEach((hoTen,i) => add('TaiKhoan', {
  _id:id('TK',i+1), email:`demo${i+1}@example.test`, matKhau:hash, hoTen,
  ngaySinh:date(`${1988+i}-05-12`), gioiTinh:['Nam','Nữ','Khác'][i%3],
  soDienThoai:`090000${String(i+1).padStart(4,'0')}`,
  diaChiNhanHang:`Số ${i+1}, Đường Mẫu, Thành phố Hồ Chí Minh`,
  vaiTro:i<4?['Người dùng','Người bán']:i===10?['Quản trị viên']:['Người dùng'],
  trangThaiTaiKhoan:i===11?'Bị khóa':'Hoạt động'
}));
const shopNames = ['Bếp Nhà Mây','Công Nghệ Sao','Thời Trang Mộc','Sách và Góc Học'];
shopNames.forEach((tenCuaHang,i) => {
  add('YeuCauDangKyNguoiBan',{_id:id('YC',i+1),tenCuaHang,moTaCuaHang:`Cửa hàng ${tenCuaHang}`,diaChiCuaHang:`Quận ${i+1}, Thành phố Hồ Chí Minh`,ngayGui:date('2026-08-01'),trangThai:'Đã phê duyệt',taiKhoanId:id('TK',i+1)});
  add('CuaHang',{_id:id('CH',i+1),tenCuaHang,moTa:`Sản phẩm chọn lọc của ${tenCuaHang}`,diaChi:`Quận ${i+1}, Thành phố Hồ Chí Minh`,trangThaiHoatDong:'Hoạt động',taiKhoanId:id('TK',i+1)});
});
[['YC005','Cửa hàng Nắng','Chờ phê duyệt','TK009'],['YC006','Góc Xanh','Đã từ chối','TK010']].forEach(([key,tenCuaHang,trangThai,taiKhoanId]) => add('YeuCauDangKyNguoiBan',{_id:key,tenCuaHang,moTaCuaHang:`Dự kiến bán hàng tại ${tenCuaHang}`,diaChiCuaHang:'Thành phố Hồ Chí Minh',ngayGui:date('2026-10-01'),trangThai,taiKhoanId}));
['Đồ gia dụng','Điện tử','Thời trang','Sách','Văn phòng phẩm','Phụ kiện'].forEach((tenDanhMuc,i)=>add('DanhMuc',{_id:id('DM',i+1),tenDanhMuc}));
const goods = [
  ['Chảo chống dính 24 cm',189000,1],['Bình giữ nhiệt 500 ml',159000,1],['Hộp đựng thực phẩm',89000,1],['Nồi inox 20 cm',329000,1],['Bộ muỗng gỗ',69000,1],['Khăn lau bếp',39000,1],
  ['Chuột không dây',249000,2],['Bàn phím cơ nhỏ gọn',799000,2],['Tai nghe có dây',199000,2],['Đèn bàn USB',299000,2],['Cáp sạc USB C',79000,6],['Giá đỡ laptop',349000,6],
  ['Áo thun cotton',149000,3],['Quần jean xanh',399000,3],['Áo khoác mỏng',459000,3],['Túi vải canvas',99000,6],['Mũ lưỡi trai',119000,6],['Tất cổ ngắn',49000,3],
  ['Sổ tay kẻ dòng',59000,5],['Bút bi xanh bộ 10',45000,5],['Truyện thiếu nhi',89000,4],['Sách kỹ năng học tập',139000,4],['Kẹp tài liệu',35000,5],['Bộ giấy ghi chú',39000,5]
];
goods.forEach(([tenSanPham,giaGoc,danhMuc],i)=>add('SanPham',{
  _id:id('SP',i+1),tenSanPham,hinhAnh:[`/anh-demo/san-pham-${i+1}.jpg`],
  moTa:`${tenSanPham} dùng để minh họa dữ liệu Soopi`,giaGoc,soLuongTon:30+i,
  trangThaiKinhDoanh:[5,17].includes(i)?'Ngừng kinh doanh':'Đang kinh doanh',
  cuaHangId:id('CH',Math.floor(i/6)+1),danhMucId:id('DM',danhMuc)
}));

const promos = [
  ['Ưu đãi nhà bếp','Giảm giá','Cửa hàng','2026-10-01','2026-10-31','Đang hoạt động','CH001'],
  ['Đồ công nghệ tháng mười','Giảm giá','Cửa hàng','2026-10-01','2026-10-31','Đang hoạt động','CH002'],
  ['Flash Sale tháng chín','Flash Sale','Cửa hàng','2026-09-01','2026-09-30','Đã kết thúc','CH003'],
  ['Mùa tựu trường','Giảm giá','Toàn sàn','2026-09-01','2026-09-30','Đã kết thúc',null],
  ['Ưu đãi cuối năm','Giảm giá','Toàn sàn','2026-12-01','2026-12-31','Chưa bắt đầu',null]
];
promos.forEach(([tenKhuyenMai,loaiKhuyenMai,phamVi,ngayBatDau,ngayKetThuc,trangThai,cuaHangId],i)=>add('KhuyenMai',{_id:id('KM',i+1),tenKhuyenMai,loaiKhuyenMai,phamVi,ngayBatDau:date(ngayBatDau),ngayKetThuc:date(ngayKetThuc),trangThai,cuaHangId}));
const promoLines = [[1,1,10,null],[1,2,null,139000],[1,3,15,null],[2,7,10,null],[2,8,null,699000],[2,9,20,null],[3,13,20,null],[3,14,10,null],[4,19,10,null],[4,20,15,null],[5,21,10,null],[5,22,15,null],[4,1,10,null]];
promoLines.forEach(([km,sp,tyLeGiam,giaKhuyenMai],i)=>add('ChiTietKhuyenMai',{_id:id('CTKM',i+1),tyLeGiam,giaKhuyenMai,khuyenMaiId:id('KM',km),sanPhamId:id('SP',sp)}));

const voucherRows = [
  ['SHIP15','Freeship','Số tiền cố định',15000,15000,100000,null],
  ['SAN10','Toàn sàn','Phần trăm',10,30000,150000,null],
  ['BEP20','Cửa hàng','Số tiền cố định',20000,20000,150000,'CH001'],
  ['TECH25','Cửa hàng','Số tiền cố định',25000,25000,200000,'CH002'],
  ['MOC10','Cửa hàng','Phần trăm',10,25000,100000,'CH003'],
  ['SACH10','Cửa hàng','Số tiền cố định',10000,10000,80000,'CH004'],
  ['SHIP30','Freeship','Số tiền cố định',30000,30000,300000,null],
  ['SAN20','Toàn sàn','Số tiền cố định',20000,20000,250000,null],
  ['BEP05','Cửa hàng','Phần trăm',5,15000,100000,'CH001']
];
voucherRows.forEach(([maVoucher,loaiVoucher,kieuGiam,giaTriGiam,giamToiDa,giaTriDonToiThieu,cuaHangId],i)=>add('Voucher',{_id:id('VC',i+1),maVoucher,tenVoucher:`Ưu đãi ${maVoucher}`,loaiVoucher,kieuGiam,giaTriGiam,giamToiDa,giaTriDonToiThieu,soLuong:100,ngayBatDau:date('2026-10-01'),ngayKetThuc:date('2026-10-31'),trangThai:'Kích hoạt',cuaHangId}));
['Mua sắm cho căn bếp','Góc làm việc tiện nghi','Trang phục mỗi ngày'].forEach((tieuDe,i)=>add('BannerQuangCao',{_id:id('BN',i+1),tieuDe,hinhAnh:`/anh-demo/banner-${i+1}.jpg`,noiDung:`Khám phá ${tieuDe.toLowerCase()} trên Soopi`,trangThai:'Kích hoạt'}));

// Giá giỏ hàng tại 11/10/2026; khuyến mãi hiệu lực chỉ có một mức cho mỗi sản phẩm.
function priceAt(spId, when) {
  const sp=byId('SanPham',spId);
  const active=data.ChiTietKhuyenMai.filter(c=>c.sanPhamId===spId && data.KhuyenMai.some(k=>k._id===c.khuyenMaiId && k.ngayBatDau<=when && when<=k.ngayKetThuc));
  if (active.length>1) throw new Error(`Khuyến mãi chồng chéo cho ${spId}`);
  if (!active.length) return sp.giaGoc;
  const c=active[0];
  return c.giaKhuyenMai===null?Math.round(sp.giaGoc*(100-c.tyLeGiam)/100):c.giaKhuyenMai;
}
const carts = [[5,[[1,2,true],[7,1,true],[19,1,false]]],[6,[[2,1,true],[8,1,false]]],[7,[[13,2,true],[16,1,true]]],[8,[[21,1,true],[20,3,true]]],[9,[[4,1,true],[10,1,false]]],[10,[[14,1,true],[22,1,true]]]];
let cartLine=0;
carts.forEach(([tk,lines],i)=>{
  const gioHangId=id('GH',i+1);
  let tongGiaTri=0;
  lines.forEach(([sp,soLuong,duocChon])=>{
    const sanPhamId=id('SP',sp);
    add('ChiTietGioHang',{_id:id('CTGH',++cartLine),soLuong,duocChon,gioHangId,sanPhamId});
    tongGiaTri+=soLuong*priceAt(sanPhamId,date('2026-10-11'));
  });
  add('GioHang',{_id:gioHangId,tongGiaTri,taiKhoanId:id('TK',tk)});
});

// Trạng thái giao dịch và đơn là dữ liệu mô phỏng để kiểm thử, không xác nhận bởi VNPay.
const txRows = [
  ['Thành công','2026-10-09T09:00:00','2026-10-09T09:04:00'],
  ['Thành công','2026-10-08T10:00:00','2026-10-08T10:03:00'],
  ['Thành công','2026-10-07T11:00:00','2026-10-07T11:04:00'],
  ['Thành công','2026-10-06T12:00:00','2026-10-06T12:05:00'],
  ['Thành công','2026-10-05T13:00:00','2026-10-05T13:03:00'],
  ['Thành công','2026-10-04T14:00:00','2026-10-04T14:02:00'],
  ['Chờ thanh toán','2026-10-11T03:00:00',null],
  ['Thất bại','2026-10-09T15:00:00','2026-10-09T15:04:00'],
  ['Hết hạn','2026-10-07T08:00:00','2026-10-08T08:01:00'],
  ['Thành công','2026-10-03T09:00:00','2026-10-03T09:06:00']
];
txRows.forEach(([trangThaiThanhToan,created,finished],i)=>add('GiaoDichThanhToan',{_id:id('GD',i+1),maGiaoDich:`DEMO-SOOPI-${String(i+1).padStart(3,'0')}`,soTien:0,phuongThucThanhToan:'VNPay',trangThaiThanhToan,thoiGianTao:at(created),thoiGianHoanTat:finished?at(finished):null}));
// tx 1 và 2 gồm hai shop trong cùng một lần thanh toán.
const orderRows = [
  [1,5,1,[[1,1],[2,1]],[1,2,3],'Hoàn thành'],
  [1,5,2,[[7,1],[9,1]],[4],'Hoàn thành'],
  [2,6,3,[[13,2],[16,1]],[5],'Hoàn thành'],
  [2,6,4,[[21,2],[20,2]],[6],'Hoàn thành'],
  [3,7,1,[[4,1],[3,2]],[8],'Đang vận chuyển'],
  [4,8,2,[[8,1],[11,2]],[7],'Đang xử lý'],
  [5,9,3,[[14,1],[17,1]],[],'Đã xác nhận'],
  [6,10,4,[[22,1],[19,2]],[],'Chờ xác nhận'],
  [7,5,1,[[1,1],[5,1]],[],'Chờ xác nhận'],
  [8,6,2,[[7,1],[10,1]],[],'Đã hủy'],
  [9,7,3,[[15,1],[16,1]],[],'Đã hủy'],
  [10,8,4,[[21,1],[23,2]],[],'Hoàn thành']
];
let lineNo=0, voucherNo=0;
orderRows.forEach(([tx,tk,shop,lines,vouchers,processing],i)=>{
  const transaction=byId('GiaoDichThanhToan',id('GD',tx));
  const donHangId=id('DH',i+1), when=transaction.thoiGianTao;
  let tongTienHang=0;
  lines.forEach(([sp,soLuong])=>{
    const sanPhamId=id('SP',sp), sanPham=byId('SanPham',sanPhamId);
    const giaBanThucTe=priceAt(sanPhamId,when);
    const thanhTien=soLuong*giaBanThucTe;
    tongTienHang+=thanhTien;
    add('ChiTietDonHang',{_id:id('CTDH',++lineNo),soLuong,giaGocTaiThoiDiemDat:sanPham.giaGoc,giaBanThucTe,thanhTien,donHangId,sanPhamId});
  });
  const phiVanChuyen=20000;
  let tongGiamVoucher=0,giamPhiVanChuyen=0;
  vouchers.forEach(v=>{
    const voucher=byId('Voucher',id('VC',v));
    const base=voucher.loaiVoucher==='Freeship'?phiVanChuyen:tongTienHang;
    const discount=Math.min(voucher.giamToiDa,voucher.kieuGiam==='Phần trăm'?Math.floor(base*voucher.giaTriGiam/100):voucher.giaTriGiam,base);
    if(voucher.loaiVoucher==='Freeship') giamPhiVanChuyen+=discount; else tongGiamVoucher+=discount;
    add('ApDungVoucher',{_id:id('ADV',++voucherNo),giaTriGiamThucTe:discount,thoiGianApDung:when,voucherId:voucher._id,donHangId});
  });
  const tongThanhToan=tongTienHang-tongGiamVoucher+phiVanChuyen-giamPhiVanChuyen;
  add('DonHang',{_id:donHangId,diaChiNhanHang:byId('TaiKhoan',id('TK',tk)).diaChiNhanHang,tongTienHang,tongGiamVoucher,phiVanChuyen,giamPhiVanChuyen,tongThanhToan,phuongThucThanhToan:'VNPay',trangThaiThanhToan:transaction.trangThaiThanhToan==='Thành công'?'Đã thanh toán':transaction.trangThaiThanhToan,trangThaiXuLy:processing,ngayTao:when,taiKhoanId:id('TK',tk),cuaHangId:id('CH',shop),giaoDichId:transaction._id});
  transaction.soTien+=tongThanhToan;
  // Tồn kho hiện tại: đơn thành công/chờ thanh toán đã giữ hàng; đơn hủy đã được hoàn.
  if(processing!=='Đã hủy') lines.forEach(([sp,qty])=>{byId('SanPham',id('SP',sp)).soLuongTon-=qty;});
});

[[1,5,'Dùng tốt, giao đúng mẫu',5],[2,5,'Sản phẩm tiện lợi',4],[3,5,'Chất liệu đẹp',5],[4,5,'Đóng gói cẩn thận',4],[24,8,'Nội dung dễ hiểu',5]].forEach(([line,tk,noiDung,soSao],i)=>{
  const detail=byId('ChiTietDonHang',id('CTDH',line));
  add('DanhGia',{_id:id('DG',i+1),soSao,noiDung,ngayDanhGia:date('2026-10-11'),taiKhoanId:id('TK',tk),sanPhamId:detail.sanPhamId,chiTietDonHangId:detail._id});
});
[[1,'Đổi trả','Tay cầm bị lỏng','Chờ xử lý',null],[3,'Khiếu nại','Hộp hàng bị móp','Đã xử lý','Chấp nhận'],[24,'Khiếu nại','Giao thiếu phụ kiện giấy','Đã xử lý','Từ chối']].forEach(([line,loaiYeuCau,noiDung,trangThaiXuLy,ketQuaXuLy],i)=>add('YeuCauDoiTraKhieuNai',{_id:id('DT',i+1),loaiYeuCau,noiDung,trangThaiXuLy,ketQuaXuLy,ngayTao:date('2026-10-11'),chiTietDonHangId:id('CTDH',line)}));

const chats=[[5,1],[6,3],[7,2],[8,4],[9,1]];
let msgNo=0;
chats.forEach(([tk,shop],i)=>{
  const cuocTroChuyenId=id('CHAT',i+1);
  add('CuocTroChuyen',{_id:cuocTroChuyenId,thoiGianBatDau:at('2026-10-10T08:00:00'),thoiGianCapNhat:at('2026-10-10T08:10:00'),taiKhoanId:id('TK',tk),cuaHangId:id('CH',shop)});
  [['Sản phẩm còn hàng không?',id('TK',tk)],['Dạ còn hàng, bạn có thể đặt trên Soopi.',id('TK',shop)],['Cảm ơn cửa hàng nhé.',id('TK',tk)]].forEach(([noiDung,nguoiGuiId],j)=>add('TinNhan',{_id:id('MSG',++msgNo),noiDung,thoiGianGui:at(`2026-10-10T08:${String(j*5).padStart(2,'0')}:00`),cuocTroChuyenId,nguoiGuiId}));
});

// Dừng nếu có dữ liệu khác hoặc seed dở dang. Không sửa/xóa document đã có.
const counts=Object.fromEntries(names.map(n=>[n,d.getCollection(n).countDocuments()]));
const fingerprint=x=>JSON.stringify(Object.keys(x).sort().map(key=>[key,x[key]]));
if(names.every(n=>counts[n]===data[n].length && data[n].every(x=>{
  const stored=d.getCollection(n).findOne({_id:x._id});
  return stored&&fingerprint(stored)===fingerprint(x);
}))){
  print('Bộ dữ liệu mẫu đã có đầy đủ; không insert lại. Chạy verify-soopi.mongosh.js để kiểm tra nội dung.');
} else {
  if(names.some(n=>counts[n]!==0)) throw new Error('CSDL đã có dữ liệu hoặc seed dở dang: '+JSON.stringify(counts));
  // Kiểm tra cấu trúc, khóa và phép tính trước khi insert.
  const errors=[];
  const ref=(source,field,target)=>data[source].forEach(x=>{if(x[field]!=null&&!byId(target,x[field])) errors.push(`${source}/${x._id}: ${field} không tồn tại`);});
  [['YeuCauDangKyNguoiBan','taiKhoanId','TaiKhoan'],['CuaHang','taiKhoanId','TaiKhoan'],['SanPham','cuaHangId','CuaHang'],['SanPham','danhMucId','DanhMuc'],['ChiTietKhuyenMai','khuyenMaiId','KhuyenMai'],['ChiTietKhuyenMai','sanPhamId','SanPham'],['Voucher','cuaHangId','CuaHang'],['ApDungVoucher','voucherId','Voucher'],['ApDungVoucher','donHangId','DonHang'],['GioHang','taiKhoanId','TaiKhoan'],['ChiTietGioHang','gioHangId','GioHang'],['ChiTietGioHang','sanPhamId','SanPham'],['DonHang','taiKhoanId','TaiKhoan'],['DonHang','cuaHangId','CuaHang'],['DonHang','giaoDichId','GiaoDichThanhToan'],['ChiTietDonHang','donHangId','DonHang'],['ChiTietDonHang','sanPhamId','SanPham'],['DanhGia','taiKhoanId','TaiKhoan'],['DanhGia','sanPhamId','SanPham'],['DanhGia','chiTietDonHangId','ChiTietDonHang'],['YeuCauDoiTraKhieuNai','chiTietDonHangId','ChiTietDonHang'],['CuocTroChuyen','taiKhoanId','TaiKhoan'],['CuocTroChuyen','cuaHangId','CuaHang'],['TinNhan','cuocTroChuyenId','CuocTroChuyen'],['TinNhan','nguoiGuiId','TaiKhoan']].forEach(x=>ref(...x));
  names.forEach(n=>{if(new Set(data[n].map(x=>x._id)).size!==data[n].length) errors.push(`${n}: trùng _id`);});
  data.DonHang.forEach(o=>{
    const lines=data.ChiTietDonHang.filter(x=>x.donHangId===o._id);
    if(lines.some(x=>byId('SanPham',x.sanPhamId).cuaHangId!==o.cuaHangId)) errors.push(`${o._id}: sản phẩm sai shop`);
    if(lines.reduce((s,x)=>s+x.thanhTien,0)!==o.tongTienHang || o.tongThanhToan!==o.tongTienHang-o.tongGiamVoucher+o.phiVanChuyen-o.giamPhiVanChuyen) errors.push(`${o._id}: tổng tiền sai`);
    const tx=byId('GiaoDichThanhToan',o.giaoDichId);
    if(o.trangThaiThanhToan!==(tx.trangThaiThanhToan==='Thành công'?'Đã thanh toán':tx.trangThaiThanhToan)) errors.push(`${o._id}: trạng thái thanh toán sai`);
    if(['Thất bại','Hết hạn'].includes(tx.trangThaiThanhToan)&&o.trangThaiXuLy!=='Đã hủy') errors.push(`${o._id}: đơn chưa hủy`);
    if(tx.trangThaiThanhToan==='Hết hạn'&&tx.thoiGianHoanTat<new Date(o.ngayTao.getTime()+24*3600000)) errors.push(`${o._id}: hết hạn trước 24 giờ`);
    const apps=data.ApDungVoucher.filter(x=>x.donHangId===o._id);
    const types=apps.map(x=>byId('Voucher',x.voucherId).loaiVoucher);
    if(new Set(types).size!==types.length) errors.push(`${o._id}: trùng loại voucher`);
    const regular=apps.filter(x=>byId('Voucher',x.voucherId).loaiVoucher!=='Freeship').reduce((s,x)=>s+x.giaTriGiamThucTe,0);
    const shipping=apps.filter(x=>byId('Voucher',x.voucherId).loaiVoucher==='Freeship').reduce((s,x)=>s+x.giaTriGiamThucTe,0);
    if(regular!==o.tongGiamVoucher||shipping!==o.giamPhiVanChuyen) errors.push(`${o._id}: phân bổ voucher sai`);
  });
  data.GiaoDichThanhToan.forEach(t=>{if(data.DonHang.filter(o=>o.giaoDichId===t._id).reduce((s,o)=>s+o.tongThanhToan,0)!==t.soTien) errors.push(`${t._id}: số tiền giao dịch sai`);});
  data.SanPham.forEach(x=>{if(x.soLuongTon<0) errors.push(`${x._id}: tồn kho âm`);});
  data.CuaHang.forEach(x=>{
    if(!byId('TaiKhoan',x.taiKhoanId).vaiTro.includes('Người bán')||!data.YeuCauDangKyNguoiBan.some(r=>r.taiKhoanId===x.taiKhoanId&&r.trangThai==='Đã phê duyệt')) errors.push(`${x._id}: chủ cửa hàng chưa được duyệt`);
  });
  data.ApDungVoucher.forEach(x=>{
    const o=byId('DonHang',x.donHangId),v=byId('Voucher',x.voucherId);
    if(v.cuaHangId&&v.cuaHangId!==o.cuaHangId) errors.push(`${x._id}: voucher sai shop`);
    if(o.tongTienHang<v.giaTriDonToiThieu||x.thoiGianApDung<v.ngayBatDau||x.thoiGianApDung>v.ngayKetThuc) errors.push(`${x._id}: voucher ngoài điều kiện`);
  });
  data.GioHang.forEach(g=>{
    const lines=data.ChiTietGioHang.filter(x=>x.gioHangId===g._id);
    if(new Set(lines.map(x=>x.sanPhamId)).size!==lines.length||g.tongGiaTri!==lines.reduce((s,x)=>s+x.soLuong*priceAt(x.sanPhamId,date('2026-10-11')),0)) errors.push(`${g._id}: giỏ hàng sai`);
  });
  data.DanhGia.forEach(x=>{
    const line=byId('ChiTietDonHang',x.chiTietDonHangId),o=byId('DonHang',line.donHangId);
    if(x.taiKhoanId!==o.taiKhoanId||x.sanPhamId!==line.sanPhamId||o.trangThaiXuLy!=='Hoàn thành') errors.push(`${x._id}: đánh giá sai đơn`);
  });
  data.TinNhan.forEach(x=>{
    const chat=byId('CuocTroChuyen',x.cuocTroChuyenId),shop=byId('CuaHang',chat.cuaHangId);
    if(![chat.taiKhoanId,shop.taiKhoanId].includes(x.nguoiGuiId)) errors.push(`${x._id}: người gửi sai`);
  });
  if(errors.length) throw new Error('Dữ liệu mẫu chưa hợp lệ:\n'+errors.join('\n'));
  names.forEach(n=>print(`${n}: sẽ thêm ${data[n].length} document`));
  // Đổi khóa và tham chiếu sau bước kiểm tra để dữ liệu mẫu khớp schema Mongoose.
  const dichThamChieu={
    YeuCauDangKyNguoiBan:{taiKhoanId:'TaiKhoan'},CuaHang:{taiKhoanId:'TaiKhoan'},
    SanPham:{cuaHangId:'CuaHang',danhMucId:'DanhMuc'},KhuyenMai:{cuaHangId:'CuaHang'},
    ChiTietKhuyenMai:{khuyenMaiId:'KhuyenMai',sanPhamId:'SanPham'},Voucher:{cuaHangId:'CuaHang'},
    ApDungVoucher:{voucherId:'Voucher',donHangId:'DonHang'},GioHang:{taiKhoanId:'TaiKhoan'},
    ChiTietGioHang:{gioHangId:'GioHang',sanPhamId:'SanPham'},
    DonHang:{taiKhoanId:'TaiKhoan',cuaHangId:'CuaHang',giaoDichId:'GiaoDichThanhToan'},
    ChiTietDonHang:{donHangId:'DonHang',sanPhamId:'SanPham'},
    DanhGia:{taiKhoanId:'TaiKhoan',sanPhamId:'SanPham',chiTietDonHangId:'ChiTietDonHang'},
    YeuCauDoiTraKhieuNai:{chiTietDonHangId:'ChiTietDonHang'},
    CuocTroChuyen:{taiKhoanId:'TaiKhoan',cuaHangId:'CuaHang'},
    TinNhan:{cuocTroChuyenId:'CuocTroChuyen',nguoiGuiId:'TaiKhoan'}
  };
  const idMoi=Object.fromEntries(names.map(n=>[n,new Map(data[n].map(x=>[x._id,new ObjectId()]))]));
  const duLieuMongo=Object.fromEntries(names.map(n=>[n,data[n].map(x=>{
    const moi={...x,_id:idMoi[n].get(x._id)};
    for(const [field,target] of Object.entries(dichThamChieu[n]||{})){
      if(x[field]!=null)moi[field]=idMoi[target].get(x[field]);
    }
    return moi;
  })]));
  // Insert theo thứ tự quan hệ. MongoDB standalone không hỗ trợ transaction nhiều collection.
  const insertOrder=['TaiKhoan','YeuCauDangKyNguoiBan','CuaHang','DanhMuc','SanPham','KhuyenMai','ChiTietKhuyenMai','Voucher','BannerQuangCao','GioHang','ChiTietGioHang','GiaoDichThanhToan','DonHang','ChiTietDonHang','ApDungVoucher','DanhGia','YeuCauDoiTraKhieuNai','CuocTroChuyen','TinNhan'];
  for(const n of insertOrder) d.getCollection(n).insertMany(duLieuMongo[n],{ordered:true});
  print('Đã thêm dữ liệu mẫu. Chạy verify-soopi.mongosh.js để kiểm tra độc lập.');
}

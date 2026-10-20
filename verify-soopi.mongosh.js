// Kiểm tra chỉ đọc dữ liệu Soopi. Chạy: mongosh mongodb://127.0.0.1:27017/soopi --file verify-soopi.mongosh.js
if (db.getName() !== 'soopi') throw new Error('Chỉ kiểm tra database soopi.');
const names=['TaiKhoan','YeuCauDangKyNguoiBan','CuaHang','DanhMuc','SanPham','KhuyenMai','ChiTietKhuyenMai','Voucher','ApDungVoucher','BannerQuangCao','GioHang','ChiTietGioHang','DonHang','ChiTietDonHang','GiaoDichThanhToan','DanhGia','YeuCauDoiTraKhieuNai','CuocTroChuyen','TinNhan'];
const available=db.getCollectionNames();
const errors=[];
names.filter(n=>!available.includes(n)).forEach(n=>errors.push(`${n}: thiếu Collection`));
if(errors.length) throw new Error(errors.join('\n'));
const all=Object.fromEntries(names.map(n=>[n,db.getCollection(n).find().toArray()]));
const find=(n,id)=>all[n].find(x=>same(x._id,id));
const fail=(n,x,message)=>errors.push(`${n}/${x._id}: ${message}`);
const same=(a,b)=>String(a)===String(b);
const integer=n=>typeof n==='number' && Number.isInteger(n);
const positive=n=>integer(n)&&n>0;
const nonnegative=n=>integer(n)&&n>=0;
const unique=(n,key)=>{
  const seen=new Set();
  all[n].forEach(x=>{const value=String(typeof key==='function'?key(x):x[key]);if(seen.has(value)) fail(n,x,`trùng ${typeof key==='string'?key:'khóa kết hợp'}`);seen.add(value);});
};
const ref=(n,field,target,nullable=false)=>all[n].forEach(x=>{
  if(x[field]==null&&nullable) return;
  if(!find(target,x[field])) fail(n,x,`${field} không trỏ tới ${target}`);
});
names.forEach(n=>{print(`${n}: ${all[n].length} document`);if(!all[n].length) errors.push(`${n}: chưa có dữ liệu`);unique(n,'_id');});
unique('TaiKhoan','email');unique('CuaHang','taiKhoanId');unique('Voucher','maVoucher');
unique('GioHang','taiKhoanId');unique('ChiTietGioHang',x=>`${x.gioHangId}|${x.sanPhamId}`);
unique('GiaoDichThanhToan','maGiaoDich');unique('DanhGia','chiTietDonHangId');
unique('YeuCauDoiTraKhieuNai','chiTietDonHangId');
unique('ChiTietKhuyenMai',x=>`${x.khuyenMaiId}|${x.sanPhamId}`);
[
  ['YeuCauDangKyNguoiBan','taiKhoanId','TaiKhoan'],['CuaHang','taiKhoanId','TaiKhoan'],
  ['SanPham','cuaHangId','CuaHang'],['SanPham','danhMucId','DanhMuc'],
  ['KhuyenMai','cuaHangId','CuaHang',true],['ChiTietKhuyenMai','khuyenMaiId','KhuyenMai'],['ChiTietKhuyenMai','sanPhamId','SanPham'],
  ['Voucher','cuaHangId','CuaHang',true],['ApDungVoucher','voucherId','Voucher'],['ApDungVoucher','donHangId','DonHang'],
  ['GioHang','taiKhoanId','TaiKhoan'],['ChiTietGioHang','gioHangId','GioHang'],['ChiTietGioHang','sanPhamId','SanPham'],
  ['DonHang','taiKhoanId','TaiKhoan'],['DonHang','cuaHangId','CuaHang'],['DonHang','giaoDichId','GiaoDichThanhToan'],
  ['ChiTietDonHang','donHangId','DonHang'],['ChiTietDonHang','sanPhamId','SanPham'],
  ['DanhGia','taiKhoanId','TaiKhoan'],['DanhGia','sanPhamId','SanPham'],['DanhGia','chiTietDonHangId','ChiTietDonHang'],
  ['YeuCauDoiTraKhieuNai','chiTietDonHangId','ChiTietDonHang'],['CuocTroChuyen','taiKhoanId','TaiKhoan'],['CuocTroChuyen','cuaHangId','CuaHang'],
  ['TinNhan','cuocTroChuyenId','CuocTroChuyen'],['TinNhan','nguoiGuiId','TaiKhoan']
].forEach(x=>ref(...x));

all.TaiKhoan.forEach(x=>{
  if(!/^\$2[abxy]\$10\$/.test(x.matKhau)) fail('TaiKhoan',x,'mật khẩu không có dạng bcrypt 10 rounds');
  if(!Array.isArray(x.vaiTro)||x.vaiTro.some(v=>!['Người dùng','Người bán','Quản trị viên'].includes(v))) fail('TaiKhoan',x,'vaiTro không hợp lệ');
  if(!['Hoạt động','Bị khóa'].includes(x.trangThaiTaiKhoan)) fail('TaiKhoan',x,'trạng thái không hợp lệ');
});
all.CuaHang.forEach(x=>{
  const owner=find('TaiKhoan',x.taiKhoanId);
  if(owner&&!owner.vaiTro.includes('Người bán')) fail('CuaHang',x,'chủ cửa hàng thiếu vai trò Người bán');
  if(!all.YeuCauDangKyNguoiBan.some(r=>same(r.taiKhoanId,x.taiKhoanId)&&r.trangThai==='Đã phê duyệt')) fail('CuaHang',x,'chủ cửa hàng chưa được duyệt');
});
all.KhuyenMai.forEach(x=>{
  if(!(x.ngayBatDau instanceof Date)||!(x.ngayKetThuc instanceof Date)||x.ngayBatDau>x.ngayKetThuc) fail('KhuyenMai',x,'khoảng ngày không hợp lệ');
});
all.SanPham.forEach(x=>{
  if(!positive(x.giaGoc)||!nonnegative(x.soLuongTon)) fail('SanPham',x,'giá hoặc tồn kho không hợp lệ');
  if(!['Đang kinh doanh','Ngừng kinh doanh'].includes(x.trangThaiKinhDoanh)) fail('SanPham',x,'trạng thái không hợp lệ');
});
all.ChiTietKhuyenMai.forEach(x=>{
  const sp=find('SanPham',x.sanPhamId), km=find('KhuyenMai',x.khuyenMaiId);
  if(!sp||!km) return;
  if(km.cuaHangId&&!same(km.cuaHangId,sp.cuaHangId)) fail('ChiTietKhuyenMai',x,'khuyến mãi cửa hàng gắn sản phẩm shop khác');
  if((x.tyLeGiam==null)===(x.giaKhuyenMai==null)) fail('ChiTietKhuyenMai',x,'phải dùng đúng một kiểu giảm');
  if(x.tyLeGiam!=null&&(!nonnegative(x.tyLeGiam)||x.tyLeGiam>100)) fail('ChiTietKhuyenMai',x,'tỷ lệ giảm không hợp lệ');
  if(x.giaKhuyenMai!=null&&(!nonnegative(x.giaKhuyenMai)||x.giaKhuyenMai>sp.giaGoc)) fail('ChiTietKhuyenMai',x,'giá khuyến mãi không hợp lệ');
});
all.ChiTietKhuyenMai.forEach(x=>{
  const k=find('KhuyenMai',x.khuyenMaiId);if(!k)return;
  all.ChiTietKhuyenMai.filter(y=>!same(y._id,x._id)&&same(y.sanPhamId,x.sanPhamId)).forEach(y=>{
    const other=find('KhuyenMai',y.khuyenMaiId);
    if(other&&k.ngayBatDau<=other.ngayKetThuc&&other.ngayBatDau<=k.ngayKetThuc) fail('ChiTietKhuyenMai',x,`chồng thời gian với ${other._id}`);
  });
});
all.Voucher.forEach(x=>{
  if(!['Freeship','Toàn sàn','Cửa hàng'].includes(x.loaiVoucher)) fail('Voucher',x,'loại không hợp lệ');
  if(x.loaiVoucher==='Cửa hàng'&&!x.cuaHangId) fail('Voucher',x,'thiếu cửa hàng');
  if(x.loaiVoucher!=='Cửa hàng'&&x.cuaHangId) fail('Voucher',x,'voucher hệ thống gắn cửa hàng');
  for(const key of ['giaTriGiam','giamToiDa','giaTriDonToiThieu','soLuong']) if(!nonnegative(x[key])) fail('Voucher',x,`${key} không hợp lệ`);
  if(x.ngayBatDau>x.ngayKetThuc) fail('Voucher',x,'ngày hiệu lực không hợp lệ');
});
function priceAt(sp,when){
  const items=all.ChiTietKhuyenMai.filter(c=>same(c.sanPhamId,sp._id)&&all.KhuyenMai.some(k=>same(k._id,c.khuyenMaiId)&&k.ngayBatDau<=when&&when<=k.ngayKetThuc));
  if(items.length>1) fail('SanPham',sp,'nhiều khuyến mãi có hiệu lực');
  if(!items.length)return sp.giaGoc;
  const c=items[0];return c.giaKhuyenMai==null?Math.round(sp.giaGoc*(100-c.tyLeGiam)/100):c.giaKhuyenMai;
}
all.GioHang.forEach(g=>{
  const lines=all.ChiTietGioHang.filter(x=>same(x.gioHangId,g._id));
  const total=lines.reduce((s,x)=>{const sp=find('SanPham',x.sanPhamId);return s+(sp?x.soLuong*priceAt(sp,new Date('2026-10-11T00:00:00Z')):0);},0);
  if(g.tongGiaTri!==total) fail('GioHang',g,`tongGiaTri ${g.tongGiaTri} khác ${total}`);
  if(!nonnegative(g.tongGiaTri)) fail('GioHang',g,'tổng giá trị âm');
});
all.ChiTietGioHang.forEach(x=>{
  const sp=find('SanPham',x.sanPhamId);
  if(!positive(x.soLuong)) fail('ChiTietGioHang',x,'số lượng không dương');
  if(sp&&sp.trangThaiKinhDoanh==='Đang kinh doanh'&&x.soLuong>sp.soLuongTon) fail('ChiTietGioHang',x,'vượt tồn kho');
  if(typeof x.duocChon!=='boolean') fail('ChiTietGioHang',x,'duocChon không phải Boolean');
});
all.ChiTietDonHang.forEach(x=>{
  const order=find('DonHang',x.donHangId), sp=find('SanPham',x.sanPhamId);
  if(order&&sp&&!same(order.cuaHangId,sp.cuaHangId)) fail('ChiTietDonHang',x,'sản phẩm thuộc shop khác');
  if(!positive(x.soLuong)||!positive(x.giaGocTaiThoiDiemDat)||!nonnegative(x.giaBanThucTe)||x.giaBanThucTe>x.giaGocTaiThoiDiemDat||x.thanhTien!==x.soLuong*x.giaBanThucTe) fail('ChiTietDonHang',x,'giá/số lượng/thành tiền sai');
});
all.DonHang.forEach(o=>{
  const lines=all.ChiTietDonHang.filter(x=>same(x.donHangId,o._id));
  if(!lines.length) fail('DonHang',o,'đơn không có sản phẩm');
  if(o.tongTienHang!==lines.reduce((s,x)=>s+x.thanhTien,0)) fail('DonHang',o,'tongTienHang sai');
  const apps=all.ApDungVoucher.filter(x=>same(x.donHangId,o._id));
  const types=apps.map(x=>find('Voucher',x.voucherId)?.loaiVoucher);
  if(new Set(types).size!==types.length) fail('DonHang',o,'trùng loại voucher');
  const regular=apps.filter(x=>find('Voucher',x.voucherId)?.loaiVoucher!=='Freeship').reduce((s,x)=>s+x.giaTriGiamThucTe,0);
  const shipping=apps.filter(x=>find('Voucher',x.voucherId)?.loaiVoucher==='Freeship').reduce((s,x)=>s+x.giaTriGiamThucTe,0);
  if(o.tongGiamVoucher!==regular||o.giamPhiVanChuyen!==shipping) fail('DonHang',o,'tổng giảm voucher sai');
  for(const key of ['tongTienHang','tongGiamVoucher','phiVanChuyen','giamPhiVanChuyen','tongThanhToan']) if(!nonnegative(o[key])) fail('DonHang',o,`${key} âm/không nguyên`);
  if(o.giamPhiVanChuyen>o.phiVanChuyen||o.tongGiamVoucher>o.tongTienHang||o.tongThanhToan!==o.tongTienHang-o.tongGiamVoucher+o.phiVanChuyen-o.giamPhiVanChuyen) fail('DonHang',o,'tongThanhToan sai');
  if(o.phuongThucThanhToan!=='VNPay'||!(o.ngayTao instanceof Date)) fail('DonHang',o,'phương thức/ngày tạo sai');
  const tx=find('GiaoDichThanhToan',o.giaoDichId);
  if(tx){
    const expected=tx.trangThaiThanhToan==='Thành công'?'Đã thanh toán':tx.trangThaiThanhToan;
    if(o.trangThaiThanhToan!==expected) fail('DonHang',o,'trạng thái thanh toán lệch giao dịch');
    if(['Thất bại','Hết hạn'].includes(expected)&&o.trangThaiXuLy!=='Đã hủy') fail('DonHang',o,'thất bại/hết hạn chưa hủy');
    if(expected==='Chờ thanh toán'&&o.trangThaiXuLy!=='Chờ xác nhận') fail('DonHang',o,'đơn chờ thanh toán có xử lý sai');
    if(expected==='Đã thanh toán'&&o.trangThaiXuLy==='Đã hủy') fail('DonHang',o,'đơn thanh toán thành công bị hủy');
    if(expected==='Hết hạn'&&new Date(o.ngayTao.getTime()+24*3600000)>tx.thoiGianHoanTat) fail('DonHang',o,'hết hạn trước 24 giờ');
  }
});
all.ApDungVoucher.forEach(x=>{
  const v=find('Voucher',x.voucherId),o=find('DonHang',x.donHangId);if(!v||!o)return;
  if(v.cuaHangId&&!same(v.cuaHangId,o.cuaHangId)) fail('ApDungVoucher',x,'voucher sai cửa hàng');
  if(v.trangThai!=='Kích hoạt'||x.thoiGianApDung<v.ngayBatDau||x.thoiGianApDung>new Date(v.ngayKetThuc.getTime()+86400000-1)||o.tongTienHang<v.giaTriDonToiThieu) fail('ApDungVoucher',x,'điều kiện áp dụng sai');
  const base=v.loaiVoucher==='Freeship'?o.phiVanChuyen:o.tongTienHang;
  const expected=Math.min(base,v.giamToiDa,v.kieuGiam==='Phần trăm'?Math.floor(base*v.giaTriGiam/100):v.giaTriGiam);
  if(x.giaTriGiamThucTe!==expected) fail('ApDungVoucher',x,`mức giảm sai: ${x.giaTriGiamThucTe} thay vì ${expected}`);
});
all.Voucher.forEach(v=>{if(all.ApDungVoucher.filter(x=>same(x.voucherId,v._id)).length>v.soLuong) fail('Voucher',v,'vượt số lượng sử dụng');});
all.GiaoDichThanhToan.forEach(t=>{
  const orders=all.DonHang.filter(o=>same(o.giaoDichId,t._id));
  if(!orders.length||t.soTien!==orders.reduce((s,o)=>s+o.tongThanhToan,0)) fail('GiaoDichThanhToan',t,'soTien không bằng tổng các đơn');
  if(!nonnegative(t.soTien)||t.phuongThucThanhToan!=='VNPay') fail('GiaoDichThanhToan',t,'số tiền/phương thức sai');
  if(t.trangThaiThanhToan==='Chờ thanh toán'&&t.thoiGianHoanTat!=null) fail('GiaoDichThanhToan',t,'giao dịch chờ đã có thời gian hoàn tất');
  if(t.trangThaiThanhToan!=='Chờ thanh toán'&&!(t.thoiGianHoanTat instanceof Date)) fail('GiaoDichThanhToan',t,'thiếu thời gian hoàn tất');
});
all.DanhGia.forEach(x=>{
  const detail=find('ChiTietDonHang',x.chiTietDonHangId),order=detail&&find('DonHang',detail.donHangId);
  if(detail&&!same(x.sanPhamId,detail.sanPhamId)) fail('DanhGia',x,'sai sản phẩm');
  if(order&&(!same(x.taiKhoanId,order.taiKhoanId)||order.trangThaiXuLy!=='Hoàn thành')) fail('DanhGia',x,'sai người mua hoặc đơn chưa hoàn thành');
  if(!integer(x.soSao)||x.soSao<1||x.soSao>5) fail('DanhGia',x,'số sao không hợp lệ');
});
all.YeuCauDoiTraKhieuNai.forEach(x=>{
  if(x.trangThaiXuLy==='Chờ xử lý'&&x.ketQuaXuLy!=null) fail('YeuCauDoiTraKhieuNai',x,'yêu cầu chờ đã có kết quả');
  if(x.trangThaiXuLy==='Đã xử lý'&&!['Chấp nhận','Từ chối'].includes(x.ketQuaXuLy)) fail('YeuCauDoiTraKhieuNai',x,'kết quả không hợp lệ');
});
all.TinNhan.forEach(x=>{
  const chat=find('CuocTroChuyen',x.cuocTroChuyenId),shop=chat&&find('CuaHang',chat.cuaHangId);
  if(chat&&shop&&!([chat.taiKhoanId,shop.taiKhoanId].some(id=>same(id,x.nguoiGuiId)))) fail('TinNhan',x,'người gửi không thuộc cuộc trò chuyện');
});
all.CuocTroChuyen.forEach(x=>{if(all.TinNhan.filter(m=>same(m.cuocTroChuyenId,x._id)).length<2) fail('CuocTroChuyen',x,'ít hơn hai tin nhắn');});
if(errors.length){print(`FAIL: ${errors.length} lỗi`);errors.forEach(x=>print(x));throw new Error('Kiểm tra dữ liệu Soopi thất bại.');}
print('PASS: 19 Collection có dữ liệu; tham chiếu, unique, giá, voucher, đơn hàng, VNPay, đánh giá và chat hợp lệ.');

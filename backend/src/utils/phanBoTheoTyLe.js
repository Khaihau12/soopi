const phanBoTheoTyLe = (tong, danhSachTrongSo) => {
  if (!Number.isSafeInteger(tong) || tong < 0 || !Array.isArray(danhSachTrongSo)
    || danhSachTrongSo.some((so) => !Number.isSafeInteger(so) || so < 0)) {
    throw new Error('Giá trị phân bổ không hợp lệ');
  }
  const tongTrongSo = danhSachTrongSo.reduce((cong, so) => cong + BigInt(so), 0n);
  if (tongTrongSo === 0n || tong === 0) return danhSachTrongSo.map(() => 0);
  if (BigInt(tong) > tongTrongSo) throw new Error('Giá trị phân bổ vượt tổng trọng số');
  const ketQua = danhSachTrongSo.map((so) => Number(BigInt(tong) * BigInt(so) / tongTrongSo));
  let conLai = tong - ketQua.reduce((cong, so) => cong + so, 0);
  for (let i = ketQua.length - 1; i >= 0 && conLai > 0; i--) {
    const them = Math.min(conLai, danhSachTrongSo[i] - ketQua[i]);
    ketQua[i] += them;
    conLai -= them;
  }
  return ketQua;
};

module.exports = { phanBoTheoTyLe };

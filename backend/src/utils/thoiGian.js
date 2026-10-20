const { taoLoi } = require('./taoLoi');

const docNgay = (giaTri, cuoiNgay = false) => {
  if (giaTri === undefined || giaTri === '') return null;
  if (typeof giaTri !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(giaTri)) throw taoLoi(400, 'Ngày lọc phải có dạng YYYY-MM-DD.');
  const ngay = new Date(`${giaTri}T00:00:00.000Z`);
  if (Number.isNaN(ngay.getTime()) || ngay.toISOString().slice(0, 10) !== giaTri) throw taoLoi(400, 'Ngày lọc không hợp lệ.');
  // Việt Nam luôn dùng UTC+7, kể cả ở ranh giới ngày.
  return new Date(ngay.getTime() - 7 * 3600000 + (cuoiNgay ? 86400000 - 1 : 0));
};

const layKhoangNgay = (tuNgay, denNgay) => {
  const tu = docNgay(tuNgay);
  const den = docNgay(denNgay, true);
  if (tu && den && tu > den) throw taoLoi(400, 'Khoảng thời gian không hợp lệ. Vui lòng chọn lại ngày bắt đầu và ngày kết thúc.');
  return { ...(tu ? { $gte: tu } : {}), ...(den ? { $lte: den } : {}) };
};

module.exports = { layKhoangNgay };

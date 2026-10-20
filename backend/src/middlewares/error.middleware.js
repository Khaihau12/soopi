const xuLyLoi = (loi, req, res, next) => {
  if (res.headersSent) {
    return next(loi);
  }

  if (loi.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
  }

  if (loi.name === 'ValidationError') {
    const moTaLoi = {
      required: 'bắt buộc',
      minlength: 'quá ngắn',
      maxlength: 'quá dài',
      min: 'nhỏ hơn mức cho phép',
      max: 'lớn hơn mức cho phép',
      enum: 'không thuộc giá trị cho phép',
    };
    const chiTiet = Object.entries(loi.errors || {}).map(([tenTruong, loiTruong]) => {
      return tenTruong + ' ' + (moTaLoi[loiTruong.kind] || 'không hợp lệ');
    });
    const message = chiTiet.length > 0
      ? 'Dữ liệu không hợp lệ: ' + chiTiet.join(', ')
      : 'Dữ liệu không hợp lệ';
    return res.status(400).json({ success: false, message });
  }

  if (loi.code === 11000) {
    return res.status(409).json({ success: false, message: 'Dữ liệu đã tồn tại' });
  }

  const statusCode = Number.isInteger(loi.statusCode) && loi.statusCode >= 400 && loi.statusCode < 500
    ? loi.statusCode
    : 500;
  if (statusCode === 500) {
    console.error('Lỗi API:', loi);
  }
  const message = statusCode === 500 ? 'Lỗi hệ thống. Vui lòng thử lại sau.' : loi.message;
  return res.status(statusCode).json({ success: false, message, ...(loi.data ? { data: loi.data } : {}) });
};

module.exports = xuLyLoi;

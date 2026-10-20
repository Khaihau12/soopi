const taoLoi = (statusCode, message) => {
  const loi = new Error(message);
  loi.statusCode = statusCode;
  return loi;
};

module.exports = { taoLoi };

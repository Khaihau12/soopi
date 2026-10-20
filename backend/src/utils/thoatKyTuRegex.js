const thoatKyTuRegex = (vanBan) => vanBan.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { thoatKyTuRegex };

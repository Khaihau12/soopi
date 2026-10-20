import { goiApi } from './httpClient.js';

export const taiAnhLen = (file) => {
  const formData = new FormData();
  formData.append('hinhAnh', file);
  return goiApi('/tep-tin/hinh-anh', { method: 'POST', formData });
};

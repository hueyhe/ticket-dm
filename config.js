const cookies = [{
  name: 'loginkey',
  value: '',
}, {
  name: 'user_id',
  value: '',
}, {
  name: 'cookie2',
  value: '',
}, {
  name: 'damai.cn_nickName',
  value: '',
}, {
  name: 'damai.cn_user',
  value: '',
}, {
  name: 'damai.cn_user_new',
  value: '',
}, {
  name: 'damai_cn_user',
  value: '',
}, {
  name: 'munb',
  value: '',
}].map(cookie => {
  cookie.domain = '.damai.cn';
  return cookie;
});

module.exports = {
  username: '',
  password: '',
  prerogativeCode: '',
  cookies,
};

const uid = (prefix = '', suffix = '') => {
  const prefixString = typeof prefix === 'string' && prefix !== '' ? prefix + '-' : '';
  const suffixString = typeof suffix === 'string' && suffix !== '' ? '-' + suffix : '';
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${prefixString}${randomString}${suffixString}`;
};

export { uid };

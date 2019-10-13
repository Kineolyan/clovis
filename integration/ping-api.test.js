const {getUrl, callApi} = require('./remote');

test('GET /ping', async () => {
  const url = getUrl(['home', 'ping'], {soni: 'present'});
  const {code} = await callApi({url});
  expect(code).toBeGreaterThanOrEqual(200);
  expect(code).toBeLessThan(300);
});

test('GET /ping without secret', async () => {
  const url = getUrl(['home', 'ping']);
  const {code} = await callApi({url});
  expect(code).toBeGreaterThanOrEqual(500);
});

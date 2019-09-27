const {getUrl, callApi} = require('./remote');

/*
  GET - https://x2a12knkme.execute-api.eu-west-3.amazonaws.com/dev/tasks
  PUT - https://x2a12knkme.execute-api.eu-west-3.amazonaws.com/dev/tasks/{id}/execution
  GET - https://x2a12knkme.execute-api.eu-west-3.amazonaws.com/dev/tasks/cat
*/

describe('GET /series', () => {
  let result;
  beforeAll(async () => {
    const url = getUrl(['series']);
    result = await callApi({url});
  });

  test('is successful', () => {
    const {code} = result;
    expect(code).toBeGreaterThanOrEqual(200);
    expect(code).toBeLessThan(300);
  });

  test('sets unique ids', () => {
    const entries = JSON.parse(result.body);
    expect(entries.length).toBeGreaterThan(0);

    const ids = entries.map(e => e.id);
    expect(ids.length).toEqual(new Set(ids).size);
  });
});

describe('PUT /series/{id}/episode', () => {
  let initialContent;
  let changeResult;
  let updateContent;

  beforeAll(async () => {
    const listUrl = getUrl(['series']);
    const initialResult = await callApi({url: listUrl});
    initialContent = JSON.parse(initialResult.body);
    
    const {id, episodeIdx} = initialContent[0];
    const url = getUrl(['series', id, 'episode'], {secret: 'username'});
    changeResult = await callApi({
      url, 
      body: JSON.stringify(episodeIdx),
      method: 'PUT'
    });

    const updatedResult = await callApi({url: listUrl});
    updateContent = JSON.parse(updatedResult.body);
  });

  test('is successful', () => {
    const {code} = changeResult;
    expect(code).toBeGreaterThanOrEqual(200);
    expect(code).toBeLessThan(300);
  });

  test('updates episode', () => {
    const {id, episodeIdx} = initialContent[0];
    const entry = updateContent.find(e => e.id === id);
    expect(entry.episodeIdx).toEqual(episodeIdx + 1);
  });

  test('updates the timestamp', () => {
    const {id, timestamp} = initialContent[0];
    const entry = updateContent.find(e => e.id === id);

    expect(entry.timestamp).toBeGreaterThan(timestamp);
  });

});

test('PUT /series/{id}/episode without secret', async () => {
  const url = getUrl(['series', 0, 'episode']);
  const {code} = await callApi({url});
  expect(code).toBeGreaterThanOrEqual(400);
});

const {getUrl, callApi} = require('./remote');

describe('GET /tasks', () => {
  let result;
  beforeAll(async () => {
    const url = getUrl(['tasks']);
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

describe('PUT /tasks/{id}/execution', () => {
  let initialContent;
  let changeResult;
  let updateContent;

  beforeAll(async () => {
    const listUrl = getUrl(['tasks']);
    const initialResult = await callApi({url: listUrl});
    initialContent = JSON.parse(initialResult.body);
    
    // It is ok to take the first, as it is the cat task, with frequency
    const {id} = initialContent[0];
    const url = getUrl(['tasks', id, 'execution'], {jarvis: 'please'});
    changeResult = await callApi({
      url, 
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

  test('updates the due date', () => {
    const {id, dueDate} = initialContent[0];
    const entry = updateContent.find(e => e.id === id);

    expect(entry.dueDate).toBeGreaterThan(dueDate);
  });

});

test('PUT /tasks/{id}/execution without secret', async () => {
  const url = getUrl(['tasks', 0, 'execution']);
  const {code} = await callApi({url});
  expect(code).toBeGreaterThanOrEqual(400);
});

test('GET /tasks/cat', async () => {
  const url = getUrl(['tasks', 'cat']);
  const {code} = await callApi({url});
  expect(code).toBeGreaterThanOrEqual(200);
  expect(code).toBeLessThan(300);
});

test('PUT /tasks/cat/execution', async () => {
  const catUrl = getUrl(['tasks', 'cat']);
  const initialResult = await callApi({url: catUrl});
  const initialTask = JSON.parse(initialResult.body);
  
  // It is ok to take the first, as it is the cat task, with frequency
  const url = getUrl(['tasks', 'cat', 'execution'], {jarvis: 'please'});
  changeResult = await callApi({
    url,
    method: 'PUT'
  });

  const updatedResult = await callApi({url: catUrl});
  const updatedTask = JSON.parse(updatedResult.body);
  expect(updatedTask.dueDate).toBeGreaterThan(initialTask.dueDate);
});

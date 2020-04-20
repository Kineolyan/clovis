<<<<<<< HEAD
const {__private__: m} = require('../../../google/tasks');
=======
const {__private__: m} = require('../../lib/google/tasks');
>>>>>>> origin/master

describe('#getFrequencyOffset', () => {
  const ONE_DAY = 24 * 3600 * 1000;

  test('for days', () => {
    expect(m.getFrequencyOffset('d')).toEqual(ONE_DAY);
  });
  test('for weeks', () => {
    expect(m.getFrequencyOffset('w')).toEqual(7 * ONE_DAY);
  });
  test('for months', () => {
    expect(m.getFrequencyOffset('m')).toEqual(30 * ONE_DAY);
  });
  test('for unrecognized unit', () => {
    const noValue = -100 * 365 * ONE_DAY;
    expect(m.getFrequencyOffset('y')).toEqual(noValue);
  });

});

describe('#computeDueDate', () => {
  const ONE_DAY = 24 * 3600 * 1000;

  test('compute the due date', () => {
    expect(m.computeDueDate('1d', 1)).toEqual(ONE_DAY + 1);
    expect(m.computeDueDate('1w', 1)).toEqual(7 * ONE_DAY + 1);
  });

  test('ignores null last occurrence', () => {
    expect(m.computeDueDate('1d', null)).toEqual(0);
  });

  test('ignores empty last occurrence', () => {
    expect(m.computeDueDate('1d', '')).toEqual(0);
  });

  test('returns 0 on invalid frequency', () => {
    expect(m.computeDueDate('one day', 1234)).toEqual(0);
  });

});

describe('#rowsToTasks', () => {
  const ONE_DAY = 24 * 3600 * 1000;
  const NOW = Date.now();

  test('convert rows to tasks', () => {
    const rows  = [
      ['t1', '1d', '', NOW],
      ['t2', '', NOW - ONE_DAY, '']
    ];
    const tasks = m.rowsToTasks(rows);
    expect(tasks).toEqual([
      {
        id: 0, 
        name: 't1', 
        frequency: '1d', 
        dueDate: NOW + ONE_DAY , 
        daysToTarget: 1
      },
      {
        id: 1, 
        name: 't2', 
        frequency: undefined, 
        dueDate: NOW - ONE_DAY, 
        daysToTarget: -1
      }
    ])
  });

  test('filters out completed tasks', () => {
    const rows  = [
      ['t1', '1d', '', NOW],
      ['t2', '', '12345', '67890'],
      ['t3', '', NOW - ONE_DAY, '']
    ];
    const ids = m.rowsToTasks(rows)
      .map(({id, name}) => ({id, name}));
    expect(ids).toEqual([
      {id: 0, name: 't1'},
      {id: 2, name: 't3'}
    ]);
  })

});
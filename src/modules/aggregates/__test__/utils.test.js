const { preferredOrder, formatDateToISO, cleanData } = require('../utils');

describe('preferredOrder', () => {
  it('should reorder object keys based on the provided order', () => {
    const inputObj = { a: 1, b: 2, c: 3 };
    const order = ['b', 'c', 'a'];
    const expectedResult = { b: 2, c: 3, a: 1 };

    expect(preferredOrder(inputObj, order)).toEqual(expectedResult);
  });

  it('should ignore missing keys', () => {
    const inputObj = { a: 1, b: 2 };
    const order = ['b', 'c', 'a'];
    const expectedResult = { b: 2, c: undefined, a: 1 };

    expect(preferredOrder(inputObj, order)).toEqual(expectedResult);
  });
});

describe('formatDateToISO', () => {
  it('should correctly format a Date object to ISO string', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    const expectedResult = "2024-01-01 07:00:00";

    expect(formatDateToISO(date)).toBe(expectedResult);
  });

  it('should throw an error for non-Date inputs', () => {
    expect(() => formatDateToISO('2024-01-01')).toThrow('Input must be a Date object');
  });
});

describe('cleanData', () => {
  it('should clean and reformat data correctly', () => {
    const input = {
      org_id: '2',
      date: '2024-01-01',
      searches: 10,
      lander_visits: 20,
      traffic_source_updated_at: '2024-01-02T15:00:00Z',
      network_updated_at: '2024-01-03T18:00:00Z'
    };
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const expectedResult = {
      org_id: 2,
      date: "2023-12-31 19:00:00",
      nbr_of_searches: 10,
      nbr_of_lander_visits: 20,
      traffic_source_updated_at: "2024-01-02 10:00:00",
      network_updated_at: "2024-01-03 13:00:00"
    };

    expect(cleanData(input)).toEqual(expectedResult);
  });
});

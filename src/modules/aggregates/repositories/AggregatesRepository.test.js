const AggregatesRepository = require('../repositories/AggregatesRepository');
const DatabaseRepository = require('../../../shared/lib/DatabaseRepository');
const ClickhouseRepository = require('../../../shared/lib/ClickhouseRepository');
const _ = require('lodash');
const { cleanData } = require('../utils');

jest.mock('../../../shared/lib/DatabaseRepository');
jest.mock('../../../shared/lib/ClickhouseRepository');
jest.mock('lodash', () => {
  const originalModule = jest.requireActual('lodash');
  return {
    ...originalModule,
    chunk: jest.fn().mockImplementation(originalModule.chunk),
  };
});

describe('AggregatesRepository.upsert', () => {
  let repo;
  let mockDatabase;
  let mockClickhouse;

  beforeEach(() => {
    mockDatabase = new DatabaseRepository();
    mockClickhouse = new ClickhouseRepository();
    repo = new AggregatesRepository(mockDatabase);
    repo.clickhouse = mockClickhouse;
  });

  it('should chunk data, transform it, and call database and clickhouse methods', async () => {
    const data = [
      {
        'unique_identifier': '123',
        'spend': 100,
        'revenue': 200,
        'network': 'facebook',
        'traffic_source': 'crossroads',
        'campaign_id': '123',
        'campaign_name': 'test',
        'adset_id': '123',
        'adset_name': 'test',
        'user_id': 1,
      }
    ];
    const chunkSize = 500;

    // Simulate the behavior of the upsert method
    const transformedData = data.map((row) => repo.toDatabaseDTO(row, 'taboola', 'crossroads'));
    const dataChunks = _.chunk(transformedData, chunkSize);

    // Mocking the database and clickhouse method calls
    mockDatabase.upsert.mockResolvedValueOnce(null); // Assuming upsert returns void or a promise of void
    mockClickhouse.insertData.mockResolvedValueOnce(null); // Assuming insertData returns void or a promise of void

    await repo.upsert(data, 'taboola', 'crossroads', chunkSize);

    // Verify that lodash's chunk method was called correctly
    expect(_.chunk).toHaveBeenCalledWith(transformedData, chunkSize);

    // Verify that the database and clickhouse methods were called with the correct arguments
    for (const chunk of dataChunks) {
      const cleanedChunk = chunk.map(cleanData);
      expect(mockDatabase.upsert).toHaveBeenCalledWith('insights', chunk, 'unique_identifier');
      for (const row of cleanedChunk) {
        expect(mockClickhouse.insertData).toHaveBeenCalledWith(expect.any(String), row);
      }
    }
  });
});

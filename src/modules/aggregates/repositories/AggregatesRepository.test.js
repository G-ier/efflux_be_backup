const AggregatesRepository = require('./AggregatesRepository');
const revealBotSheets = require('../reports/revealBotSheets');

jest.mock('../reports/revealBotSheets', () => jest.fn());

describe('AggregatesRepository', () => {
  let aggregatesRepository;
  let mockDatabase;

  beforeEach(() => {
    mockDatabase = {}; // mock the database object
    aggregatesRepository = new AggregatesRepository(mockDatabase);
  });

  describe('revealBotSheets', () => {
    it('should call revealBotSheets with correct parameters', async () => {
      const params = {
        startDate: '2021-01-01',
        endDate: '2021-01-31',
        aggregateBy: 'campaigns',
        trafficSource: 'facebook',
        network: 'crossroads',
        today: false
      };

      await aggregatesRepository.revealBotSheets(...Object.values(params));
      expect(revealBotSheets).toHaveBeenCalledWith(mockDatabase, ...Object.values(params));
    });

    // Additional tests can be written for different parameter combinations
  });

  describe('generateUpsertQuery', () => {
    it('should generate the correct SQL query', () => {
      const rowToInsert = {
        org_id: 1,
        event_timestamp: new Date('2021-01-01T00:00:00Z'),
        campaign_id: 100,
        campaign_name: 'Test Campaign',
        adset_id: 200,
        adset_name: 'Test Adset',
        user_id: 300,
        ad_account_id: 400,
        revenue: 500.00,
        spend: 600.00,
        spend_plus_fee: 700.00,
        link_clicks: 10,
        network_conversions: 5,
        network_uniq_conversions: 3,
        nbr_of_searches: 15,
        nbr_of_visitors: 20,
        nbr_of_tracked_visitors: 25,
        nbr_of_impressions: 30,
        nbr_of_lander_visits: 35,
        unique_identifier: 'unique_id_123',
        unallocated_revenue: 800.00,
        unallocated_spend: 900.00,
        unallocated_spend_plus_fee: 1000.00,
        traffic_source_conversions: 40,
        traffic_source: 'facebook',
        traffic_source_clicks: 45,
        traffic_source_updated_at: new Date('2021-01-01T12:00:00Z'),
        postback_conversions: 50,
        postback_lander_conversions: 55,
        postback_serp_conversions: 60,
        network_updated_at: '2021-01-02T00:00:00Z',
        network: 'test_network'
      };
      const query = aggregatesRepository.generateUpsertQuery(rowToInsert);
      expect(query.includes('INSERT INTO efflux.insights')).toBe(true);
    });
  });
});

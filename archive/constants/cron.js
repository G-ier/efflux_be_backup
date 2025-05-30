module.exports = {
  EVERY_TEN_MINUTES: process.env.EVERY_TEN_MINUTES || '*/10 * * * *',
  EVERY_FORTY_SECONDS: ['0,40 0/2 * * * *', '20 1/2 * * * *'],
  FB_REGULAR: process.env.FB_REGULAR || '10,25,40,55 * * * *',
  FB_HOURLY: process.env.FB_REGULAR || '2 * * * *',
  CR_REGULAR: process.env.CR_REGULAR || '*/10 * * * *',
  CR_HOURLY: process.env.CR_REGULAR || '14 * * * *',
  GDN_REGULAR: process.env.GDN_REGULAR || '*/6 * * * *',
  AMG_REGULAR: process.env.AMG_REGULAR || '*/10 * * * *',
  OB_REGULAR: process.env.OB_REGULAR || '*/2 * * * *',
  AFTER_MIDNIGHT: process.env.AFTER_MIDNIGHT || '4 11 * * *',
  CR_DAILY: process.env.CR_DAILY || '15 8 * * *',
  CR_DAILY2: process.env.CR_DAILY2 || '4 17 * * *',
  FB_DAILY: process.env.FB_DAILY || '5 8 * * *',
  FB_AFTERNOON: process.env.FB_DAILY || '5 12 * * *',
  GDN_DAILY: process.env.GDN_DAILY || '15 8 * * *',
  AMG_TEN_MINUTES: process.env.AMG_TEN_MINUTES || '*/10 * * * *',
  G_FIVE_MINUTES: process.env.G_FIVE_MINUTES || '*/5 * * * *',
  SHEET_REGULAR: process.env.SHEET_REGULAR || '13,28,2,0 * * * *',
  SHEET_HOURLY: process.env.SHEET_HOURLY || '2 * * * *',
  SYSTEM1_HOURLY: process.env.SYSTEM1_HOURLY || '*/10 * * * *',
  SYSTEM1_DAILY: process.env.SYSTEM1_DAILY|| '15 8 * * *',
  SEDO_REGULAR: process.env.SEDO_REGULAR || '*/15 * * * *',
  SEDO_DAILY: process.env.SEDO_REGULAR || '25 * * * *',
  SEDO_HOURLY: process.env.SEDO_REGULAR || '5 * * * *',
  PB_REGULAR: process.env.PB_REGULAR || '*/15 * * * *',
  CF_REGULAR: process.env.CF_REGULAR || '*/15 * * * *',
  CF_MORNING_FILL: process.env.CF_REGULAR || '5 3 * * *',
  SYSTEM1_EVERY_5_MINUTES: process.env.SYSTEM1_EVERY_5_MINUTES || '2-59/5 * * * *',
  PARTITIONS_DAILY: '15 8 * * *',
  MEDIA_NET_REGULAR: '5 * * * *',
  MEDIA_NET_AFTER_ESTIMATIONS: '0 10,14 * * *',
}

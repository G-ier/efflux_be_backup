const calculateEstRevenue = (conversions, revenue, pb_conversions) => {
  return `SUM(${pb_conversions}) *
          SUM(${revenue})::decimal /
          CASE SUM(${conversions})::decimal
            WHEN 0 THEN null
            ELSE SUM(${conversions})::decimal END`
}

const calculateProfit = (revenue, spend) => {
  return `(SUM(${revenue}) - SUM(${spend}))::decimal`
}

const calculateCPA = (conversions, spend) => {
  return `ROUND(SUM(${spend})::decimal /
          CASE SUM(${conversions})::decimal
            WHEN 0 THEN null
            ELSE SUM(${conversions})::decimal END, 2)`
}

const calculateRPI = (revenue, impressions) => {
  return `SUM(${revenue})::decimal /
         CASE SUM(${impressions})::decimal WHEN 0 THEN null ELSE SUM(${impressions})::decimal END`
}

const calculateCPC = (link_clicks, spend) => {
  return `SUM(${spend})::decimal /
        CASE SUM(${link_clicks})::decimal WHEN 0 THEN null ELSE SUM(${link_clicks})::decimal END`
}

const calculateRPC = (revenue, conversions) => {
  return `ROUND(SUM(${revenue})::decimal /
          CASE SUM(${conversions})::decimal
            WHEN 0 THEN null
            ELSE SUM(${conversions})::decimal END, 2)`
}

const calculateROI = (revenue, spend) => {
  return `CASE SUM(${spend})::decimal
            WHEN 0 THEN null ELSE
            (SUM(${revenue})::decimal - SUM(${spend})::decimal) /
              SUM(${spend})::decimal * 100
          END`
}

module.exports = {
  EST_REVENUE: `SUM(agg_fbc.pb_conversions) *
                SUM(agg_cr.revenue)::decimal /
                CASE SUM(agg_cr.conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_cr.conversions)::decimal END`,
  PROFIT: `(SUM(agg_cr.revenue) - SUM(agg_fb.spend))::decimal`,
  EST_PROFIT: ``,
  CPA: `SUM(agg_fb.spend)::decimal /
        CASE SUM(agg_cr.conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_cr.conversions)::decimal END`,
  LIVE_CPA: `SUM(agg_fb.spend)::decimal /
             CASE SUM(agg_fbc.pb_conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_fbc.pb_conversions)::decimal END`,
  RPI: `SUM(agg_cr.revenue)::decimal /
        CASE SUM(agg_fb.impressions)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.impressions)::decimal END`,
  CPC: `SUM(agg_fb.spend)::decimal /
        CASE SUM(agg_fb.link_clicks)::decimal WHEN 0 THEN null ELSE SUM(agg_fb.link_clicks)::decimal END`,
  RPC: `SUM(agg_cr.revenue)::decimal /
        CASE SUM(agg_cr.conversions)::decimal WHEN 0 THEN null ELSE SUM(agg_cr.conversions)::decimal END`,
  calculateEstRevenue,
  calculateProfit,
  calculateCPA,
  calculateRPI,
  calculateCPC,
  calculateRPC,
  calculateROI
}

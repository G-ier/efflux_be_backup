function calculateEstRevenue(pbConversions, revenue, conversions) {
  if (conversions) return +((pbConversions * revenue) / conversions).toFixed(3);
  return 0;
}

function calculateRPI(revenue, impressions) {
  if (impressions) return +(revenue / impressions).toFixed(2);
  return 0;
}

function calculateRPC(revenue, conversions) {
  if (conversions) return +(revenue / conversions).toFixed(2);
  return 0;
}

function calculateCPA(spend, conversions) {
  if (conversions) return +(spend / conversions).toFixed(2);
  return 0;
}

function calculateCPAROI(revenue, spend, conversions, pbConversions) {
  const cpa = calculateCPA(spend, pbConversions);
  const rpc = calculateRPC(revenue, conversions);
  if (cpa) return +(((rpc - cpa) / cpa) * 100).toFixed(2);
  return 0;
}

function calculateCPC(spend, linkClicks) {
  if (linkClicks) return +(spend / linkClicks).toFixed(2);
  return 0;
}

function calculateCTR(conversions, visitors) {
  if (visitors) return +((conversions / visitors) * 100).toFixed(2);
  return 0;
}

function calculateRPM(revenue, visitors) {
  if (visitors) return +((revenue / visitors) * 1000).toFixed(2);
  return 0;
}

function calculateROI(revenue, spend) {
  if (spend) return +(((revenue - spend) / spend) * 100).toFixed(2);
  return 0;
}

function calculateProfitLoss(revenue, spend) {
  if (!revenue) revenue = 0;
  if (!spend) spend = 0;
  return +(revenue - spend).toFixed(2);
}

function convertToPercent(value) {
  if (value) return `${value.toFixed(2)}%`;
  return `0.0%`;
}

function convertToCurrencyValue(value) {
  if (value) return `$${value.toFixed(2)}`;
  return `$0.0`;
}

module.exports = {
  calculateEstRevenue,
  calculateRPI,
  calculateCPAROI,
  calculateCPC,
  calculateRPM,
  calculateCTR,
  calculateRPC,
  calculateCPA,
  calculateROI,
  convertToPercent,
  convertToCurrencyValue,
  calculateProfitLoss,
};

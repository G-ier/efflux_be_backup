const axios = require("axios");
const async = require("async");
const { OB_API_URL, OB_TOKEN_V1 } = require("../constants/outbrain");
const _ = require("lodash");
const db = require("../data/dbConfig");
const { add } = require("../common/models");

const fields = "BidBySections,CampaignOptimization,CampaignPixels";

async function login(auth) {
  const url = `${OB_API_URL}/login`;
  const { data } = await axios.get(url, {
    headers: {
      "Authorization": `Basic ${auth}`,
    },
  });

  return {
    token: data[OB_TOKEN_V1],
    user: parseToken(data[OB_TOKEN_V1]),
  };
}

async function getAdAccount(token, id) {
  const url = `${OB_API_URL}/marketers`;
  const { data } = await axios.get(url, {
    params: {
      id,
    },
    headers: {
      [OB_TOKEN_V1]: token,
    },
  });

  return data;
}

async function getCampaignsByAdAccount(token, adAccountIds) {
  const allCampaigns = await async.mapLimit(adAccountIds, 20, async (adAccountId) => {
    const url = `${OB_API_URL}/marketers/${adAccountId}/campaigns`;
    const { data } = await axios.get(url, {
      params: {
        extraFields: fields,
        daysToLookBackForChanges: 1,
        limit: 50,
        fetch: "all",
        includeArchived: false,
      },
      headers: {
        [OB_TOKEN_V1]: token,
      },
    });
    return data?.campaigns || [];
  });

  return _.flatten(allCampaigns);
}

async function getAdAccounts(token) {
  const url = `${OB_API_URL}/marketers`;
  const { data } = await axios.get(url, {
    headers: {
      [OB_TOKEN_V1]: token,
    },
  });

  return data.marketers;
}

async function updateAdAccount(token, id, updateData) {
  const url = `${OB_API_URL}/marketers`;
  const { data } = await axios.put(url, { updateData }, {
    params: {
      id,
    },
    headers: {
      [OB_TOKEN_V1]: token,
    },
  });

  return data;
}

async function getCampaigns(token, campaignIds) {
  const url = `${OB_API_URL}/campaigns/:campaignIds/multiple`;
  const { data } = await axios.get(url, {
    params: {
      campaignIds,
      extraFields: fields,
    },
    headers: {
      [OB_TOKEN_V1]: token,
    },
  });

  return data;
}

async function getCampaign(token, id) {
  const url = `${OB_API_URL}/campaigns`;
  const { data } = await axios.get(url, {
    params: {
      id,
      extraFields: fields,
    },
    headers: {
      [OB_TOKEN_V1]: token,
    },
  });

  return data;
}

async function getSectionsMetadata(token, ids) {

  const chunks = _.chunk(ids, 100);

  const url = `${OB_API_URL}sections`;
  let count = 0;

  const sectionsRawMeta = await async.mapSeries(chunks, async (sectionsIds) => {
    console.log(`sections chunk #${++count}...`);
    const { data = [] } = await axios.post(url, {
      sectionsIds,
    }, {
      headers: {
        [OB_TOKEN_V1]: token,
      },
    }).catch(err => {
      console.log(`Error fetching sections metadata: `, err.response || err);
      return {};
    });
    console.log(`sections chunk #${count} loaded ${data.sections?.length} results`);
    return data.sections || [];
  });
  const sectionsMeta = _.flatten(sectionsRawMeta);
  console.log(`Total sections loaded ${sectionsMeta.length}`);
  return sectionsMeta;
}

async function getSectionsByHour(token, marketerId, params) {
  const url = `${OB_API_URL}realtime/marketers/${marketerId}/sectionsHourly`;
  try {
    const { data } = await axios.get(url, {
      params: {
        hours: params.hours,
        campaignId: params.campaignId,
      },
      headers: {
        [OB_TOKEN_V1]: token,
      },
    });

    return data?.dimensions || [];
  } catch (e) {
    console.log("getSectionsByHour", e);
  }
}

function parseToken(token) {
  const decoded = Buffer.from(token, "base64").toString("utf-8");
  const user = JSON.parse(extractJSON(decoded, "{", "}:"));
  return user;
}

function extractJSON(str, start, end) {
  const startIndex = str.indexOf(start);
  const endIndex = str.indexOf(end, startIndex);
  if (startIndex != -1 && endIndex != -1 && endIndex > startIndex)
    return str.substring(startIndex, endIndex + 1);
}

async function addOutbrainData(data, timestamp) {
  const removeIds = _.map(data, "section_id");
  await db("outbrain")
    .whereIn("section_id", removeIds)
    .andWhereRaw("timestamp >= ?", [timestamp])
    .del();
  await add("outbrain", data);
}

module.exports = {
  login,
  getAdAccount,
  updateAdAccount,
  getAdAccounts,
  getCampaigns,
  getCampaign,
  parseToken,
  getCampaignsByAdAccount,
  getSectionsByHour,
  getSectionsMetadata,
  addOutbrainData,
};

const { Lightsail } = require("aws-sdk");
const parsers = require("./parsers");

const S3Service = require("./aws.s3.service");

const MAX_RESULTS = 10;
const MISSING_OR_INCORRECT_CREDENTIALS_MESSAGE = "Missing or incorrect credentials - please select valid access and secret keys first";

// auto complete helper methods

function mapAutoParams(autoParams) {
  const params = {};
  autoParams.forEach((param) => {
    params[param.name] = parsers.autocomplete(param.value);
  });
  return params;
}

/** *
 * @returns {{id, value}} formatted autocomplete item
 ** */
function getAutoResult(id, value) {
  return {
    id: id || value,
    value: value || id,
  };
}

function filterItems(items, query) {
  let filteredItems = items;
  if (query) {
    const qWords = query.split(/[. ]/g).map((word) => word.toLowerCase()); // split by '.' or ' ' and make lower case
    filteredItems = filteredItems.filter((item) => (
      qWords.every((word) => item.value.toLowerCase().includes(word))
    ));
    filteredItems = filteredItems.sort((word1, word2) => (
      word1.value.toLowerCase().indexOf(qWords[0]) - word2.value.toLowerCase().indexOf(qWords[0])
    ));
  }
  return filteredItems.splice(0, MAX_RESULTS);
}

/** *
 * @returns {[{id, value}]} filtered result items
 ** */
function handleResult(result, query, keyField, valField) {
  if (!result || result.length === 0) { return []; }
  const items = result.map((item) => (
    getAutoResult(keyField ? item[keyField] : item, keyField ? item[valField] : item)
  ));
  return filterItems(items, query);
}

function listAuto(listFuncName, outputName, fields = []) {
  return async (query, pluginSettings, triggerParameters) => {
    const settings = mapAutoParams(pluginSettings); const
      params = mapAutoParams(triggerParameters);
    const client = S3Service.from(params, settings);
    let nextToken; const
      items = [];
    do {
      // eslint-disable-next-line
      const result = await client[listFuncName]({
        ...params,
        maxResults: 1000,
        nextToken,
      });
      items.push(...handleResult(result[outputName], query, ...fields));
      nextToken = result.nextToken || result.NextToken || result.Marker;
    } while (nextToken && items.length < MAX_RESULTS);
    return items;
  };
}

async function listRegions(query, pluginSettings, actionParams) {
  const settings = mapAutoParams(pluginSettings);
  let params = mapAutoParams(actionParams);
  params = { ...params, REGION: params.REGION || "eu-west-1" };
  const s3 = S3Service.from(params, settings);

  const lightsail = new Lightsail({
    accessKeyId: params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
    secretAccessKey: params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY,
    region: parsers.autocomplete(params.REGION || settings.REGION),
  });

  const s3RegionsPromise = s3.listRegions();
  const lightsailRegionsPromise = lightsail.getRegions().promise();

  return Promise.all([s3RegionsPromise, lightsailRegionsPromise]).then(
    ([s3Regions, lightsailRegions]) => s3Regions.Regions.map((s3Region) => {
      const lsRegion = lightsailRegions.regions.find((x) => x.name === s3Region.RegionName);
      return lsRegion
        ? { id: s3Region.RegionName, value: `${s3Region.RegionName} (${lsRegion.displayName})` }
        : { id: s3Region.RegionName, value: s3Region.RegionName };
    }).sort((a, b) => {
      if (a.value > b.value) { return 1; }
      if (a.value < b.value) { return -1; }
      return 0;
    }),
  ).catch((err) => {
    console.error(err);
    throw MISSING_OR_INCORRECT_CREDENTIALS_MESSAGE;
  });
}

module.exports = {
  listRegions,
  listBucketsAuto: listAuto("listBuckets", "Buckets", ["Name"]),
  listKeysAuto: listAuto("listKeys", "Keys", ["KeyId"]),
};

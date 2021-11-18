const parsers = require("./parsers");

const S3Service = require('./aws.s3.service');
const MAX_RESULTS = 10;

// auto complete helper methods

function mapAutoParams(autoParams){
  const params = {};
  autoParams.forEach(param => {
    params[param.name] = parsers.autocomplete(param.value);
  });
  return params;
}

/***
 * @returns {[{id, value}]} filtered result items
 ***/
 function handleResult(result, query, keyField, valField){
  if (!result || result.length == 0) return [];
  const items = result.map(item => 
    getAutoResult(keyField ? item[keyField] : item, keyField ? item[valField] : item));
  return filterItems(items, query);
}

/***
 * @returns {{id, value}} formatted autocomplete item
 ***/
function getAutoResult(id, value) {
  return {
    id: id || value,
    value: value || id
  };
}

function filterItems(items, query){
  if (query){
    const qWords = query.split(/[. ]/g).map(word => word.toLowerCase()); // split by '.' or ' ' and make lower case
    items = items.filter(item => qWords.every(word => item.value.toLowerCase().includes(word)));
    items = items.sort((word1, word2) => word1.value.toLowerCase().indexOf(qWords[0]) - word2.value.toLowerCase().indexOf(qWords[0]));
  }
  return items.splice(0, MAX_RESULTS);
}

function listAuto(listFuncName, outputName, fields = []) {
  return async (query, pluginSettings, triggerParameters) => {
    const settings = mapAutoParams(pluginSettings), params = mapAutoParams(triggerParameters);
    const client = S3Service.from(params, settings);
    var nextToken, items = [];
    do {
      var result = await client[listFuncName]({
        ...params,
        maxResults: 1000,
        nextToken
      });
      items.push(...handleResult(result[outputName], query, ...fields));
      nextToken = result.nextToken || result.NextToken || result.Marker;
    } while (nextToken && items.length < MAX_RESULTS);
    return items;
  }
}

module.exports = {
  listRegionsAuto: listAuto("listRegions", "Regions", ["RegionName"]),
  listBucketsAuto: listAuto("listBuckets", "Buckets", ["Name"]),
  listKeysAuto: listAuto("listKeys", "Keys", ["KeyId"])
}

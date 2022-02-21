const aws = require("aws-sdk");
const { autocomplete } = require("kaholo-aws-plugin");

module.exports = {
  listRegionsAutocomplete: autocomplete.listRegions,
  listBucketsAutocomplete: autocomplete.simpleList(aws.S3, "listBuckets", "Buckets", "Name"),
  listKeysAutocomplete: autocomplete.simpleList(aws.S3, "listKeys", "Keys", "KeyId"),
};

const aws = require("aws-sdk");
const { autocomplete } = require("kaholo-aws-plugin");

module.exports = {
  listRegions: autocomplete.listRegions,
  listBuckets: autocomplete.simpleList(aws.S3, "listBuckets", "Buckets", "Name"),
  listKeys: autocomplete.simpleList(aws.S3, "listKeys", "Keys", "KeyId"),
};

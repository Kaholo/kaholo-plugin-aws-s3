const { autocomplete } = require("@kaholo/aws-plugin-library");

module.exports = {
  listBucketsAutocomplete: autocomplete.autocompleteListFromAwsCall("listBuckets", "Buckets", "Name"),
  listKeysAutocomplete: autocomplete.autocompleteListFromAwsCall("listKeys", "Keys", "KeyId"),
};

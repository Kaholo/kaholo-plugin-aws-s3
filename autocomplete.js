const { ListKeysCommand } = require("@aws-sdk/client-kms");
const { ListBucketsCommand } = require("@aws-sdk/client-s3");
const { autocomplete } = require("@kaholo/aws-plugin-library");

module.exports = {
  listBucketsAutocomplete: autocomplete.autocompleteListFromAwsCall(ListBucketsCommand, "Buckets", "Name"),
  listKeysAutocomplete: autocomplete.autocompleteListFromAwsCall(ListKeysCommand, "Keys", "KeyId"),
};

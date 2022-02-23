const aws = require("aws-sdk");

const awsPlugin = require("kaholo-aws-plugin");
const payloadFunctions = require("./payload-functions");
const helpers = require("./helpers");
const autocomplete = require("./autocomplete");

async function uploadFileToBucket(action, settings) {
  const { client, params } = awsPlugin.handleInput(aws.S3, action, settings);
  const fileBody = await helpers.readFile(params.srcPath);

  const payload = {
    Bucket: params.bucket,
    Key: params.destPath,
    Body: fileBody,
  };

  return client.upload(payload).promise();
}

async function putBucketAcl(action, settings) {
  const { client, params } = awsPlugin.handleInput(aws.S3, action, settings, {
    groups: "array",
    users: "array",
    emails: "array",
  });

  if (!(params.grantToSignedUser
      || params.groups?.length
      || params.users?.length
      || params.emails?.length)) {
    throw new Error("Please provide at least one receiver of the permissions");
  }

  const permissionTypes = helpers.resolveBucketAclPermissions(params);
  const newGrantees = await helpers.getNewGrantees(params, client);
  const currentAcl = await client.getBucketAcl({ Bucket: params.bucket }).promise();
  const currentGrants = params.dontOverwrite ? currentAcl.Grants : [];
  const newGrants = helpers.getGrants(newGrantees, permissionTypes);

  return client.putBucketAcl({
    Bucket: params.bucket,
    AccessControlPolicy: {
      Grants: helpers.combineGrants(currentGrants, newGrants),
      Owner: currentAcl.Owner,
    },
  }).promise();
}

async function putBucketPolicy(action, settings) {
  const client = awsPlugin.getServiceInstance(aws.S3, action.params, settings);
  const params = awsPlugin.helpers.readActionArguments(action, { Policy: "object" });
  return client.putBucketPolicy({ ...params, Policy: JSON.stringify(params.Policy) }).promise();
}

async function putBucketLogging(action, settings) {
  const { client, params } = awsPlugin.handleInput(aws.S3, action, settings, {
    groups: "array",
    users: "array",
    emails: "array",
  });

  if (params.disableLogging) {
    return client.putBucketLogging({
      Bucket: params.srcBucket,
      BucketLoggingStatus: {
        LoggingEnabled: false,
      },
    }).promise();
  }

  let { targetBucket, targetPrefix } = params;
  let currentGrants = [];

  if (params.dontOverwrite) {
    const loggingConfig = (await client.getBucketLogging({ Bucket: params.srcBucket }).promise());
    if (loggingConfig.LoggingEnabled) {
      currentGrants = loggingConfig.TargetGrants || currentGrants;
      targetBucket = loggingConfig.TargetBucket || targetBucket;
      targetPrefix = loggingConfig.TargetPrefix || targetPrefix;
    }
  }

  if (!targetBucket || !targetPrefix) {
    throw new Error("When enabling logging you must provide Target Bucket and Target Prefix");
  }

  const newGrantees = await helpers.getNewGrantees(params, client);
  const newGrants = params.permissionType
    ? helpers.getGrants(newGrantees, [params.permissionType])
    : [];
  const targetGrants = helpers.combineGrants(currentGrants, newGrants);

  const payload = {
    Bucket: params.srcBucket,
    BucketLoggingStatus: {
      LoggingEnabled: {
        TargetBucket: targetBucket,
        TargetPrefix: targetPrefix,
        TargetGrants: targetGrants.length > 0 ? targetGrants : undefined,
      },
    },
  };

  return client.putBucketLogging(payload).promise();
}

async function putBucketEncryption(action, settings) {
  const { client, params } = awsPlugin.handleInput(aws.S3, action, settings);

  if (!params.sseAlgo || params.sseAlgo === "none") {
    return client.putBucketEncryption({
      Bucket: params.bucket,
      ServerSideEncryptionConfiguration: { Rules: [] },
    }).promise();
  }

  if (params.sseAlgo === "aws:kms" && !params.kmsMasterKey) {
    throw new Error("Please provide KMS Master Key ID with AWS KMS Encryption");
  }

  const payload = {
    Bucket: params.bucket,
    ServerSideEncryptionConfiguration: {
      Rules: [{
        ApplyServerSideEncryptionByDefault: {
          SSEAlgorithm: params.sseAlgo,
          KMSMasterKeyID: params.kmsMasterKey,
        },
        BucketKeyEnabled: params.bucketKeyEnabled,
      }],
    },
  };

  return client.putBucketEncryption(payload).promise();
}

function s3Func(functionName, payloadFunction = null) {
  return awsPlugin.mapToAws(aws.S3, functionName, payloadFunction);
}

module.exports = {
  createBucket: s3Func("createBucket", payloadFunctions.prepareCreateBucketPayload),
  deleteBucket: s3Func("deleteBucket"),
  deleteObject: s3Func("deleteObject"),
  listObjectsInBucket: s3Func("listObjectsV2"),
  listBuckets: s3Func("listBuckets"),
  managePublicAccessBlock: s3Func("managePublicAccessBlock", payloadFunctions.prepareManagePublicAccessBlockPayload),
  putCannedACL: s3Func("putCannedACL"),
  putBucketVersioning: s3Func("putBucketVersioning", payloadFunctions.preparePutBucketVersioningPayload),
  getBucketPolicy: s3Func("getBucketPolicy"),
  deleteBucketPolicy: s3Func("deleteBucketPolicy"),
  deleteBucketWebsite: s3Func("deleteBucketWebsite"),
  getBucketWebsite: s3Func("getBucketWebsite"),
  putBucketWebsite: s3Func("putBucketWebsite", payloadFunctions.preparePutBucketWebsitePayload),
  putBucketWebsiteRedirect: s3Func("putBucketWebsite", payloadFunctions.preparePutBucketWebsiteRedirectPayload),
  uploadFileToBucket,
  putBucketAcl,
  putBucketLogging,
  putBucketEncryption,
  putBucketPolicy,

  // Autocomplete Functions
  listBucketsAutocomplete: autocomplete.listBucketsAutocomplete,
  listRegionsAutocomplete: autocomplete.listRegionsAutocomplete,
  listKeysAutocomplete: autocomplete.listKeysAutocomplete,
};

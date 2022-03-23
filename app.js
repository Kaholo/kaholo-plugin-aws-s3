const _ = require("lodash");
const path = require("path");
const aws = require("aws-sdk");
const awsPlugin = require("kaholo-aws-plugin");

const payloadFunctions = require("./payload-functions");
const helpers = require("./helpers");
const autocomplete = require("./autocomplete");
const consts = require("./consts.json");

async function deleteBucket(client, params) {
  if (params.recursively) {
    await helpers.emptyDirectory(client, params.Bucket);
  }
  return client.deleteBucket({ Bucket: params.Bucket }).promise().then(() => "Bucket deleted successfully");
}

async function deleteObject(client, params) {
  if (params.failOnObjectNotFound) {
    const listObjectsResult = await client.listObjectsV2({
      Bucket: params.Bucket,
      Prefix: params.Key,
    }).promise();

    if (listObjectsResult.Contents.length === 0) {
      throw new Error(`No object in selected bucket under path: "${params.Key}"`);
    }
  }
  if (params.recursively) {
    await helpers.emptyDirectory(client, params.Bucket, params.Key);
  }
  return client.deleteObject({ Bucket: params.Bucket, Key: params.Key }).promise().then(() => "Operation finished successfully");
}

async function uploadFileToBucket(client, params) {
  const fileBody = await helpers.readFile(params.srcPath);
  const filename = path.basename(params.srcPath);

  const payload = {
    Bucket: params.bucket,
    Key: helpers.sanitizeS3Path(params.destPath, filename),
    Body: fileBody,
  };

  return client.upload(payload).promise();
}

async function putBucketAcl(client, params) {
  if (!params.grantToSignedUser
    && _.isEmpty(params.groups)
    && _.isEmpty(params.users)
    && _.isEmpty(params.emails)
  ) {
    throw new Error("Please provide at least one receiver of the permissions");
  }

  if (!_.isEmpty(params.emails)) {
    const bucketLocation = await client.getBucketLocation({ Bucket: params.bucket }).promise();
    if (!consts.REGIONS_SUPPORTING_EMAIL_GRANTEES.includes(bucketLocation.LocationConstraint)) {
      throw new Error(consts.INCORRECT_REGION_FOR_EMAIL_GRANTEES_ERROR_MESSAGE);
    }
  }

  const permissionTypes = helpers.resolveBucketAclPermissions(params);
  const newGrantees = await helpers.getNewGrantees(client, params);
  const currentAcl = await client.getBucketAcl({ Bucket: params.bucket }).promise();
  const currentGrants = params.dontOverwrite ? currentAcl.Grants : [];
  const newGrants = helpers.getGrants(newGrantees, permissionTypes);
  const payload = {
    Bucket: params.bucket,
    AccessControlPolicy: {
      Grants: helpers.combineGrants(currentGrants, newGrants),
      Owner: currentAcl.Owner,
    },
  };

  return client.putBucketAcl(payload).promise();
}

async function putBucketPolicy(client, params) {
  return client.putBucketPolicy({ ...params, Policy: JSON.stringify(params.Policy) }).promise();
}

async function putBucketLogging(client, params) {
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
    const loggingConfig = await client.getBucketLogging({ Bucket: params.srcBucket }).promise();
    if (loggingConfig.LoggingEnabled) {
      currentGrants = loggingConfig.TargetGrants || currentGrants;
      targetBucket = loggingConfig.TargetBucket || targetBucket;
      targetPrefix = loggingConfig.TargetPrefix || targetPrefix;
    }
  }

  if (!targetBucket || !targetPrefix) {
    throw new Error("When enabling logging you must provide Target Bucket and Target Prefix");
  }

  const newGrantees = await helpers.getNewGrantees(client, params);
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

async function putBucketEncryption(client, params) {
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

module.exports = awsPlugin.bootstrap(
  aws.S3,
  {
    createBucket: awsPlugin.mapToAwsMethod("createBucket", payloadFunctions.prepareCreateBucketPayload),
    deleteBucket,
    deleteObject,
    listObjectsInBucket: awsPlugin.mapToAwsMethod("listObjectsV2"),
    listBuckets: awsPlugin.mapToAwsMethod("listBuckets"),
    managePublicAccessBlock: awsPlugin.mapToAwsMethod("managePublicAccessBlock", payloadFunctions.prepareManagePublicAccessBlockPayload),
    putCannedACL: awsPlugin.mapToAwsMethod("putCannedACL"),
    putBucketVersioning: awsPlugin.mapToAwsMethod("putBucketVersioning", payloadFunctions.preparePutBucketVersioningPayload),
    getBucketPolicy: awsPlugin.mapToAwsMethod("getBucketPolicy"),
    deleteBucketPolicy: awsPlugin.mapToAwsMethod("deleteBucketPolicy"),
    deleteBucketWebsite: awsPlugin.mapToAwsMethod("deleteBucketWebsite"),
    getBucketWebsite: awsPlugin.mapToAwsMethod("getBucketWebsite"),
    putBucketWebsite: awsPlugin.mapToAwsMethod("putBucketWebsite", payloadFunctions.preparePutBucketWebsitePayload),
    putBucketWebsiteRedirect: awsPlugin.mapToAwsMethod("putBucketWebsite", payloadFunctions.preparePutBucketWebsiteRedirectPayload),
    uploadFileToBucket,
    putBucketAcl,
    putBucketLogging,
    putBucketEncryption,
    putBucketPolicy,
  },
  {
    // Autocomplete Functions
    ...autocomplete,
  },
);

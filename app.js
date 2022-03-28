const _ = require("lodash");
const path = require("path");
const aws = require("aws-sdk");
const awsPlugin = require("kaholo-aws-plugin");

const payloadFunctions = require("./payload-functions");
const helpers = require("./helpers");
const autocomplete = require("./autocomplete");

const simpleAwsFunctions = {
  createBucket: awsPlugin.generateAwsMethod("createBucket", payloadFunctions.prepareCreateBucketPayload),
  listObjectsInBucket: awsPlugin.generateAwsMethod("listObjectsV2"),
  listBuckets: awsPlugin.generateAwsMethod("listBuckets"),
  managePublicAccessBlock: awsPlugin.generateAwsMethod("managePublicAccessBlock", payloadFunctions.prepareManagePublicAccessBlockPayload),
  putCannedACL: awsPlugin.generateAwsMethod("putCannedACL"),
  putBucketVersioning: awsPlugin.generateAwsMethod("putBucketVersioning", payloadFunctions.preparePutBucketVersioningPayload),
  getBucketPolicy: awsPlugin.generateAwsMethod("getBucketPolicy"),
  deleteBucketPolicy: awsPlugin.generateAwsMethod("deleteBucketPolicy"),
  deleteBucketWebsite: awsPlugin.generateAwsMethod("deleteBucketWebsite"),
  getBucketWebsite: awsPlugin.generateAwsMethod("getBucketWebsite"),
  putBucketWebsite: awsPlugin.generateAwsMethod("putBucketWebsite", payloadFunctions.preparePutBucketWebsitePayload),
  putBucketWebsiteRedirect: awsPlugin.generateAwsMethod("putBucketWebsite", payloadFunctions.preparePutBucketWebsiteRedirectPayload),
};

async function deleteBucket(client, params) {
  if (params.recursively) {
    await helpers.emptyDirectory(client, params.Bucket);
  }
  return client.deleteBucket({ Bucket: params.Bucket }).promise();
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
  return client.deleteObject({ Bucket: params.Bucket, Key: params.Key }).promise();
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

  return client.putBucketAcl(payload).promise()
    .catch((error) => {
      if (error.code === "UnsupportedArgument" && params.emails.length > 0) {
        console.error("Notice: Using email address to specify a grantee is only supported for buckets created in specific AWS Regions. For more information visit: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketAcl.html\n");
      }
      throw error;
    });
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
    ...simpleAwsFunctions,
    deleteBucket,
    deleteObject,
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

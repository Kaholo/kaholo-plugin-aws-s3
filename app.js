const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const aws = require("aws-sdk");
const awsPlugin = require("@kaholo/aws-plugin-library");

const payloadFunctions = require("./payload-functions");
const helpers = require("./helpers");
const autocomplete = require("./autocomplete");

const simpleAwsFunctions = {
  createBucket: awsPlugin.generateAwsMethod("createBucket", payloadFunctions.prepareCreateBucketPayload),
  listObjectsInBucket: awsPlugin.generateAwsMethod("listObjectsV2", payloadFunctions.prepareListObjectsPayload),
  listBuckets: awsPlugin.generateAwsMethod("listBuckets"),
  managePublicAccessBlock: awsPlugin.generateAwsMethod("putPublicAccessBlock", payloadFunctions.prepareManagePublicAccessBlockPayload),
  putCannedACL: awsPlugin.generateAwsMethod("putBucketAcl", payloadFunctions.preparePutCannedAclPayload),
  putBucketVersioning: awsPlugin.generateAwsMethod("putBucketVersioning", payloadFunctions.preparePutBucketVersioningPayload),
  getBucketPolicy: awsPlugin.generateAwsMethod("getBucketPolicy", payloadFunctions.prepareGetBucketPolicyPayload),
  deleteBucketPolicy: awsPlugin.generateAwsMethod("deleteBucketPolicy", payloadFunctions.prepareDeleteBucketPolicyPayload),
  deleteBucketWebsite: awsPlugin.generateAwsMethod("deleteBucketWebsite", payloadFunctions.prepareDeleteBucketWebsitePayload),
  getBucketWebsite: awsPlugin.generateAwsMethod("getBucketWebsite", payloadFunctions.prepareGetBucketWebsitePayload),
  putBucketWebsite: awsPlugin.generateAwsMethod("putBucketWebsite", payloadFunctions.preparePutBucketWebsitePayload),
  putBucketWebsiteRedirect: awsPlugin.generateAwsMethod("putBucketWebsite", payloadFunctions.preparePutBucketWebsiteRedirectPayload),
};

async function deleteBucket(client, params) {
  if (params.RECURSIVELY) {
    await helpers.emptyDirectory(client, params.BUCKET_NAME);
  }
  return client.deleteBucket({ Bucket: params.BUCKET_NAME }).promise();
}

async function deleteObject(client, params) {
  if (params.failOnObjectNotFound) {
    const listObjectsResult = await client.listObjectsV2({
      Bucket: params.BUCKET_NAME,
      Prefix: params.OBJECT_NAME,
    }).promise();

    const foundObject = listObjectsResult.Contents.find(
      (object) => object.Key === params.OBJECT_NAME || object.Key.startsWith(`${params.OBJECT_NAME}/`),
    );

    if (!foundObject) {
      throw new Error(`No object in selected bucket under path: "${params.OBJECT_NAME}"`);
    }
  }
  if (params.RECURSIVELY) {
    const objectPrefix = ["/", "*"].includes(params.OBJECT_NAME) ? "" : params.OBJECT_NAME;
    await helpers.emptyDirectory(client, params.BUCKET_NAME, objectPrefix);
  }
  return client.deleteObject({ Bucket: params.BUCKET_NAME, Key: params.OBJECT_NAME }).promise();
}

async function uploadFileToBucket(client, params) {
  if (!fs.existsSync(params.FILE_PATH)) {
    throw new Error(`Couldn't find the file at ${params.FILE_PATH}`);
  }

  const payload = {
    Bucket: params.BUCKET_NAME,
    Key: helpers.sanitizeS3Path(params.DEST_FILE_PATH, path.basename(params.FILE_PATH)),
    Body: fs.createReadStream(params.FILE_PATH),
  };

  return client.upload(payload).promise();
}

async function putBucketAcl(client, params) {
  if (!params.grantToSignedUser
    && _.isEmpty(params.URI)
    && _.isEmpty(params.userID)
    && _.isEmpty(params.emailAddress)
  ) {
    throw new Error("Please provide at least one receiver of the permissions");
  }

  const permissionTypes = helpers.resolveBucketAclPermissions(params);
  const newGrantees = await helpers.getNewGrantees(client, params);
  const currentAcl = await client.getBucketAcl({ Bucket: params.BUCKET_NAME }).promise();
  const currentGrants = params.dontOverwrite ? currentAcl.Grants : [];
  const newGrants = helpers.getGrants(newGrantees, permissionTypes);
  const payload = {
    Bucket: params.BUCKET_NAME,
    AccessControlPolicy: {
      Grants: helpers.combineGrants(currentGrants, newGrants),
      Owner: currentAcl.Owner,
    },
  };

  return client.putBucketAcl(payload).promise()
    .catch((error) => {
      if (error.code === "UnsupportedArgument" && params.emailAddress.length > 0) {
        console.error("Notice: Using email address to specify a grantee is only supported for buckets created in specific AWS Regions. For more information visit: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketAcl.html\n");
      }
      throw error;
    });
}

async function putBucketPolicy(client, params) {
  return client.putBucketPolicy({
    Bucket: params.bucketName,
    Policy: JSON.stringify(params.policy),
  }).promise();
}

async function putBucketLogging(client, params) {
  if (params.disableLogging) {
    return client.putBucketLogging({
      Bucket: params.bucketName,
      BucketLoggingStatus: {},
    }).promise();
  }

  let { targetBucket, targetPrefix } = params;
  let currentGrants = [];

  if (params.dontOverwrite) {
    const loggingConfig = await client.getBucketLogging({ Bucket: params.bucketName }).promise();
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
    Bucket: params.bucketName,
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
      Bucket: params.bucketName,
      ServerSideEncryptionConfiguration: { Rules: [] },
    }).promise();
  }

  if (params.sseAlgo === "aws:kms" && !params.kmsMasterKey) {
    throw new Error("Please provide KMS Master Key ID with AWS KMS Encryption");
  }

  const payload = {
    Bucket: params.bucketName,
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

module.exports = {
  ...awsPlugin.bootstrap(
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
    // Autocomplete Functions
    _.omit(autocomplete, "listKeysAutocomplete"),
    {
      ACCESS_KEY: "accessKeyId",
      SECRET_KEY: "secretAccessKey",
      REGION: "REGION",
    },
  ),
  ...awsPlugin.bootstrap(
    aws.KMS,
    {},
    _.pick(autocomplete, "listKeysAutocomplete"),
    {
      ACCESS_KEY: "accessKeyId",
      SECRET_KEY: "secretAccessKey",
      REGION: "REGION",
    },
  ),
  listRegionsAutocomplete: awsPlugin.autocomplete.listRegions,
};

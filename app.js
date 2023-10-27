const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const awsPlugin = require("@kaholo/aws-plugin-library");

const { KMSClient } = require("@aws-sdk/client-kms");

const {
  S3Client,
  CreateBucketCommand,
  ListObjectsV2Command,
  ListBucketsCommand,
  PutPublicAccessBlockCommand,
  PutBucketAclCommand,
  PutBucketVersioningCommand,
  GetBucketPolicyCommand,
  DeleteBucketPolicyCommand,
  DeleteBucketWebsiteCommand,
  GetBucketWebsiteCommand,
  PutBucketWebsiteCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  GetBucketAclCommand,
  PutBucketPolicyCommand,
  PutBucketLoggingCommand,
  GetBucketLoggingCommand,
  PutBucketEncryptionCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { promisify } = require("util");
const payloadFunctions = require("./payload-functions");
const helpers = require("./helpers");
const autocomplete = require("./autocomplete");

const simpleAwsFunctions = {
  createBucket: awsPlugin.generateAwsMethod(
    CreateBucketCommand,
    payloadFunctions.prepareCreateBucketPayload,
  ),
  listObjectsInBucket: awsPlugin.generateAwsMethod(
    ListObjectsV2Command,
    payloadFunctions.prepareListObjectsPayload,
  ),
  listBuckets: awsPlugin.generateAwsMethod(ListBucketsCommand),
  managePublicAccessBlock: awsPlugin.generateAwsMethod(
    PutPublicAccessBlockCommand,
    payloadFunctions.prepareManagePublicAccessBlockPayload,
  ),
  putCannedACL: awsPlugin.generateAwsMethod(
    PutBucketAclCommand,
    payloadFunctions.preparePutCannedAclPayload,
  ),
  putBucketVersioning: awsPlugin.generateAwsMethod(
    PutBucketVersioningCommand,
    payloadFunctions.preparePutBucketVersioningPayload,
  ),
  getBucketPolicy: awsPlugin.generateAwsMethod(
    GetBucketPolicyCommand,
    payloadFunctions.prepareGetBucketPolicyPayload,
  ),
  deleteBucketPolicy: awsPlugin.generateAwsMethod(
    DeleteBucketPolicyCommand,
    payloadFunctions.prepareDeleteBucketPolicyPayload,
  ),
  deleteBucketWebsite: awsPlugin.generateAwsMethod(
    DeleteBucketWebsiteCommand,
    payloadFunctions.prepareDeleteBucketWebsitePayload,
  ),
  getBucketWebsite: awsPlugin.generateAwsMethod(
    GetBucketWebsiteCommand,
    payloadFunctions.prepareGetBucketWebsitePayload,
  ),
  putBucketWebsite: awsPlugin.generateAwsMethod(
    PutBucketWebsiteCommand,
    payloadFunctions.preparePutBucketWebsitePayload,
  ),
  putBucketWebsiteRedirect: awsPlugin.generateAwsMethod(
    PutBucketWebsiteCommand,
    payloadFunctions.preparePutBucketWebsiteRedirectPayload,
  ),
};

const CREDENTIAL_KEYS = {
  ACCESS_KEY: "accessKeyId",
  SECRET_KEY: "secretAccessKey",
  REGION: "REGION",
};

async function deleteBucket(client, params) {
  if (params.RECURSIVELY) {
    await helpers.emptyDirectory(client, params.BUCKET_NAME);
  }

  return client.send(new DeleteBucketCommand({ Bucket: params.BUCKET_NAME }));
}

async function deleteObject(client, params) {
  if (params.failOnObjectNotFound) {
    const listObjectsResult = await simpleAwsFunctions.listObjectsInBucket({
      BUCKET_NAME: params.BUCKET_NAME,
      prefix: params.OBJECT_NAME,
    });

    const foundObject = listObjectsResult.Contents.find(
      (object) => object.Key === params.OBJECT_NAME || object.Key.startsWith(`${params.OBJECT_NAME}/`),
    );

    if (!foundObject) {
      throw new Error(`No object in selected bucket under path: "${params.OBJECT_NAME}"`);
    }
  }

  if (params.RECURSIVELY) {
    const objectPrefix = ["/", "*"].includes(params.OBJECT_NAME)
      ? ""
      : params.OBJECT_NAME;

    await helpers.emptyDirectory(client, params.BUCKET_NAME, objectPrefix);
  }

  return client.send(new DeleteObjectCommand({
    Bucket: params.BUCKET_NAME,
    Key: params.OBJECT_NAME,
  }));
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

  return client.send(new PutObjectCommand(payload));
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
  const currentAcl = await client.send(new GetBucketAclCommand({ Bucket: params.BUCKET_NAME }));
  const currentGrants = params.dontOverwrite ? currentAcl.Grants : [];
  const newGrants = helpers.getGrants(newGrantees, permissionTypes);
  const payload = {
    Bucket: params.BUCKET_NAME,
    AccessControlPolicy: {
      Grants: helpers.combineGrants(currentGrants, newGrants),
      Owner: currentAcl.Owner,
    },
  };

  return client.send(new PutBucketAclCommand(payload))
    .catch((error) => {
      if (error.code === "UnsupportedArgument" && params.emailAddress.length > 0) {
        console.error("Notice: Using email address to specify a grantee is only supported for buckets created in specific AWS Regions. For more information visit: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketAcl.html\n");
      }
      throw error;
    });
}

async function putBucketPolicy(client, params) {
  return client.send(new PutBucketPolicyCommand({
    Bucket: params.bucketName,
    Policy: JSON.stringify(params.policy),
  }));
}

async function putBucketLogging(client, params) {
  if (params.disableLogging) {
    return client.send(new PutBucketLoggingCommand({
      Bucket: params.bucketName,
      BucketLoggingStatus: {},
    }));
  }

  let { targetBucket, targetPrefix } = params;
  let currentGrants = [];

  if (params.dontOverwrite) {
    const loggingConfig = await client.send(new GetBucketLoggingCommand({
      Bucket: params.bucketName,
    }));

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

  return client.send(new PutBucketLoggingCommand(payload));
}

async function putBucketEncryption(client, params) {
  if (!params.sseAlgo || params.sseAlgo === "none") {
    return client.send(new PutBucketEncryptionCommand({
      Bucket: params.bucketName,
      ServerSideEncryptionConfiguration: { Rules: [] },
    }));
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

  return client.send(new PutBucketEncryptionCommand(payload));
}

async function downloadFileFromBucket(
  /** @type {S3Client} */ client,
  params,
) {
  const { absolutePath } = params.destinationPath;
  const payload = {
    Bucket: params.bucket,
    Key: params.objectPath,
  };

  console.info(`Downloading ${payload.Key} object from ${payload.Bucket} bucket`);
  const response = await client.send(new GetObjectCommand(payload));

  console.info(`File downloaded, saving to ${absolutePath}`);
  const destinationStream = fs.createWriteStream(absolutePath);
  response.Body.pipe(destinationStream);
  await promisify(destinationStream.on.bind(destinationStream))("close");

  return "";
}

module.exports = _.merge(
  awsPlugin.bootstrap(
    S3Client,
    {
      ...simpleAwsFunctions,
      deleteBucket,
      deleteObject,
      uploadFileToBucket,
      downloadFileFromBucket,
      putBucketAcl,
      putBucketLogging,
      putBucketEncryption,
      putBucketPolicy,
    },
    _.omit(autocomplete, "listKeysAutocomplete"),
    CREDENTIAL_KEYS,
  ),
  awsPlugin.bootstrap(
    KMSClient,
    {},
    _.pick(autocomplete, "listKeysAutocomplete"),
    CREDENTIAL_KEYS,
  ),
  {
    listRegionsAutocomplete: awsPlugin.autocomplete.listRegions,
  },
);

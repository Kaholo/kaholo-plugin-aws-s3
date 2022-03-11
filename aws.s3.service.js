const AWS = require("aws-sdk");
const fs = require("fs");
const {
  getAwsCallback, removeUndefinedAndEmpty, parseGrantees, parseGrantee, combineGrants, getGrants,
} = require("./helpers");
const parsers = require("./parsers");

async function emptyS3Directory(bucket, dir, s3) {
  const listParams = {
    Bucket: bucket,
  };
  if (dir) {
    listParams.Prefix = dir;
  }

  const listedObjects = await s3.listObjectsV2(listParams).promise();

  if (listedObjects.Contents.length === 0) { return; }

  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] },
  };

  listedObjects.Contents.forEach(({ Key }) => {
    console.warn(`adding ${Key} to delete`);
    deleteParams.Delete.Objects.push({ Key });
  });

  await s3.deleteObjects(deleteParams).promise();

  if (listedObjects.IsTruncated) {
    await emptyS3Directory(bucket, dir, s3);
  }
}

module.exports = class S3Service {
  constructor({ accessKeyId, secretAccessKey, region }) {
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("Didn't provide access key!");
    }
    const creds = { accessKeyId, secretAccessKey };
    if (region) { creds.region = region; }
    this.creds = creds;
    this.s3 = new AWS.S3(creds);
  }

  static from(params, settings) {
    return new S3Service({
      accessKeyId: params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
      secretAccessKey: params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY,
      region: parsers.autocomplete(params.REGION || settings.REGION),
    });
  }

  // helper function for putBucketAcl and for putBucketLogging
  async getNewGrantees({
    groups, users, emails, grantToSignedUser,
  }) {
    const newGrantees = [
      ...parseGrantees(groups, "Group"),
      ...parseGrantees(users, "CanonicalUser"),
      ...parseGrantees(emails, "EmailAddress"),
    ];
    if (grantToSignedUser) {
      const signedUserId = (await this.s3.listBuckets().promise()).Owner.ID;
      if (!signedUserId) {
        throw new Error("Couldn't get signed user's canonical ID.");
      }
      newGrantees.push(parseGrantee(signedUserId, "CanonicalUser"));
    }
    return newGrantees;
  }

  async createBucket({ bucket }) {
    if (!bucket) { throw new Error("Must specify a bucket name."); }
    return this.s3.createBucket(removeUndefinedAndEmpty({
      Bucket: bucket,
      CreateBucketConfiguration: {
        LocationConstraint: this.creds.region,
      },
    })).promise();
  }

  async deleteBucket({ bucket, recursively }) {
    if (!bucket) { throw new Error("Must specify a bucket to delete."); }
    if (recursively) {
      await emptyS3Directory(bucket, "", this.s3);
    }
    return this.s3.deleteBucket({ Bucket: bucket }).promise();
  }

  async uploadFileToBucket({ bucket, srcPath, destPath }) {
    if (!bucket || !srcPath || !destPath) {
      throw new Error("Didn't provide one of the required parameters.");
    }
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Didn't find the file at ${srcPath}`);
    }
    const client = this.s3;
    const fileStream = fs.createReadStream(srcPath);
    let body = "";
    return new Promise((resolve, reject) => {
      fileStream.on("error", (err) => reject(new Error(`Error reading source file: ${err.message}`)));
      fileStream.on("data", (chunk) => {
        body += chunk;
      });
      fileStream.on("end", () => {
        client.upload({
          Bucket: bucket,
          Key: destPath,
          Body: body,
        }, getAwsCallback(resolve, reject));
      });
    });
  }

  async deleteObject({ bucket, path, recursively }) {
    if (!bucket || !path) {
      throw new Error("Didn't provide one of the required parameters.");
    }
    if (recursively) {
      await emptyS3Directory(bucket, path, this.s3);
    }
    return this.s3.deleteObject({
      Bucket: bucket,
      Key: path,
    }).promise();
  }

  // manage bucket configurations methods

  async managePublicAccessBlock({
    bucket, blockPublicAcls, blockPublicPolicy,
    ignorePublicAcls, restrictPublicBuckets,
  }) {
    if (!bucket) { throw new Error("Bucket was not specified!."); }
    return this.s3.putPublicAccessBlock({
      Bucket: bucket,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: blockPublicAcls || false,
        BlockPublicPolicy: blockPublicPolicy || false,
        IgnorePublicAcls: ignorePublicAcls || false,
        RestrictPublicBuckets: restrictPublicBuckets || false,
      },
    }).promise();
  }

  async putBucketAcl({
    bucket, objGrantType, aclGrantType, groups, users,
    emails, grantToSignedUser, dontOverwrite,
  }) {
    if (!bucket || !(grantToSignedUser || groups.length || users.length || emails.length)) {
      throw new Error("Didn't provide one of the required parameters.");
    }
    let permissionTypes = [];
    if (aclGrantType === "readWrite" && objGrantType === "readWrite") {
      permissionTypes = ["FULL_CONTROL"];
    } else {
      if (objGrantType === "readWrite") { permissionTypes = ["READ", "WRITE"]; } else if (objGrantType && objGrantType !== "none") {
        const grantTypeWrite = objGrantType === "GrantWrite" ? "WRITE" : objGrantType;
        permissionTypes = [
          objGrantType === "GrantRead"
            ? "READ"
            : grantTypeWrite,
        ];
      }

      if (aclGrantType === "readWrite") { permissionTypes.push("READ_ACP", "WRITE_ACP"); } else if (aclGrantType && aclGrantType !== "none") {
        const aclGrantTypeWrite = aclGrantType === "GrantWriteACP" ? "WRITE_ACP" : aclGrantType;
        permissionTypes.push(
          aclGrantType === "GrantReadACP"
            ? "READ_ACP"
            : aclGrantTypeWrite,
        );
      }

      if (permissionTypes.length === 0) {
        throw new Error("You must specify at least one of the following: Object Grant Type/ACL Grant Type");
      }
    }
    const newGrantees = await this.getNewGrantees({
      groups, users, emails, grantToSignedUser,
    });
    const currentAcl = await this.s3.getBucketAcl({ Bucket: bucket }).promise();
    const currentGrants = dontOverwrite ? currentAcl.Grants : [];
    return this.s3.putBucketAcl({
      Bucket: bucket,
      AccessControlPolicy: {
        Grants: combineGrants(currentGrants, getGrants(newGrantees, permissionTypes)),
        Owner: currentAcl.Owner,
      },
    }).promise();
  }

  async putCannedACL({ bucket, ACL }) {
    if (!bucket || !ACL) {
      throw new Error("Didn't provide one of the required parameters.");
    }
    return this.s3.putBucketAcl({
      Bucket: bucket,
      ACL,
    }).promise();
  }

  async putBucketVersioning({
    bucket, status, mfaDelete, mfa,
  }) {
    if (!bucket || (mfaDelete === "Enabled" && !mfa)) {
      throw new Error("Didn't provide one of the required parameters.");
    }
    return this.s3.putBucketVersioning({
      Bucket: bucket,
      VersioningConfiguration: {
        MFADelete: mfaDelete || "Disabled",
        Status: status,
      },
      MFA: mfa,
    }).promise();
  }

  async putBucketPolicy({ bucket, policy }) {
    if (!bucket || !policy) {
      throw new Error("Didn't provide one of the required parameters.");
    }
    return this.s3.putBucketPolicy({
      Bucket: bucket,
      Policy: JSON.stringify(policy),
    }).promise();
  }

  async getBucketPolicy({ bucket }) {
    if (!bucket) { throw new Error("Must specify a bucket."); }
    return this.s3.getBucketPolicy({ Bucket: bucket }).promise();
  }

  async deleteBucketPolicy({ bucket }) {
    if (!bucket) { throw new Error("Must specify a bucket."); }
    return this.s3.deleteBucketPolicy({ Bucket: bucket }).promise();
  }

  async putBucketLogging({
    srcBucket, disableLogging, targetBucket, targetPrefix,
    permissionType, groups, users, emails, grantToSignedUser, dontOverwrite,
  }) {
    if (!srcBucket) { throw new Error("Must specify a source bucket."); }
    if (disableLogging) {
      return this.s3.putBucketLogging({
        Bucket: srcBucket,
        BucketLoggingStatus: {
          LoggingEnabled: false,
        },
      }).promise();
    }
    let currentGrants = [];
    let resolvedTargetBucket = targetBucket;
    let resolvedTargetPrefix = targetPrefix;
    if (dontOverwrite) {
      const {
        LoggingEnabled: logging,
      } = await this.s3.getBucketLogging({ Bucket: srcBucket }).promise();
      if (logging) {
        currentGrants = currentGrants || logging.TargetGrants;
        resolvedTargetBucket = targetBucket || logging.TargetBucket;
        resolvedTargetPrefix = targetPrefix || logging.TargetPrefix;
      }
    }
    if (!resolvedTargetBucket || !resolvedTargetPrefix) {
      throw new Error("When enabling logging you must provide Target Bucket and Target Prefix");
    }

    const newGrantees = await this.getNewGrantees({
      groups, users, emails, grantToSignedUser,
    });
    const targetGrants = combineGrants(
      currentGrants,
      permissionType ? getGrants(newGrantees, [permissionType]) : [],
    );

    return this.s3.putBucketLogging({
      Bucket: srcBucket,
      BucketLoggingStatus: {
        LoggingEnabled: {
          TargetBucket: resolvedTargetBucket,
          TargetPrefix: resolvedTargetPrefix,
          TargetGrants: targetGrants.length > 0 ? targetGrants : undefined,
        },
      },
    }).promise();
  }

  async putBucketEncryption({
    bucket, sseAlgo, kmsMasterKey, bucketKeyEnabled,
  }) {
    if (!bucket) { throw new Error("Must specify a bucket."); }
    if (!sseAlgo || sseAlgo === "none") {
      return this.s3.putBucketEncryption({
        Bucket: bucket,
        ServerSideEncryptionConfiguration: { Rules: [] },
      }).promise();
    }
    if (sseAlgo === "aws:kms" && !kmsMasterKey) {
      throw new Error("Must provide KMS Master Key ID with AWS KMS Encryption");
    }
    return this.s3.putBucketEncryption({
      Bucket: bucket,
      ServerSideEncryptionConfiguration: {
        Rules: [{
          ApplyServerSideEncryptionByDefault: {
            SSEAlgorithm: sseAlgo,
            KMSMasterKeyID: kmsMasterKey,
          },
          BucketKeyEnabled: bucketKeyEnabled,
        }],
      },
    }).promise();
  }

  async putBucketWebsite({
    bucket, errorDocument, indexDocument, routingRules,
  }) {
    if (!bucket) { throw new Error("Must specify a bucket."); }
    return this.s3.putBucketWebsite(removeUndefinedAndEmpty({
      Bucket: bucket,
      WebsiteConfiguration: {
        ErrorDocument: {
          Key: errorDocument,
        },
        IndexDocument: {
          Suffix: indexDocument,
        },
        RoutingRules: routingRules && routingRules.length > 0 ? routingRules : undefined,
      },
    })).promise();
  }

  async putBucketWebsiteRedirect({ bucket, redirectTo, redirectProtocol }) {
    if (!bucket || !redirectTo) {
      throw new Error("Didn't provide one of the required parameters.");
    }
    return this.s3.putBucketWebsite(removeUndefinedAndEmpty({
      Bucket: bucket,
      WebsiteConfiguration: {
        RedirectAllRequestsTo: {
          HostName: redirectTo,
          Protocol: redirectProtocol,
        },
      },
    })).promise();
  }

  async deleteBucketWebsite({ bucket }) {
    if (!bucket) { throw new Error("Must specify a bucket."); }
    return this.s3.deleteBucketWebsite({ Bucket: bucket }).promise();
  }

  async getBucketWebsite({ bucket }) {
    if (!bucket) { throw new Error("Must specify a bucket."); }
    return this.s3.getBucketWebsite({ Bucket: bucket }).promise();
  }

  // list functions

  async listRegions() {
    if (!this.creds.region) {
      // need to specify region in creds for some reason even to list regions
      this.creds.region = "us-east-1";
    }
    const ec2 = new AWS.EC2(this.creds);
    return ec2.describeRegions().promise();
  }

  async listBuckets() {
    return this.s3.listBuckets().promise();
  }

  async listObjectsInBucket({
    bucket, prefix, nextToken, maxResults,
  }) {
    if (!bucket) { throw new Error("Must specify a bucket to list it's objects."); }
    return this.s3.listObjectsV2({
      Bucket: bucket,
      ContinuationToken: nextToken,
      Prefix: prefix,
      MaxKeys: maxResults,
    }).promise();
  }

  async listKeys({ maxResults, nextToken }) {
    const KMS = new AWS.KMS(this.creds);
    return KMS.listKeys({
      Limit: maxResults,
      Marker: nextToken,
    }).promise();
  }
};

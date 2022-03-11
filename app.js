const parsers = require("./parsers");
const S3Service = require('./aws.s3.service');

async function createBucket(action, settings){
    const { BUCKET_NAME: bucket } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.createBucket({
        bucket: parsers.string(bucket)
    });
}

async function uploadFileToBucket(action, settings){
    const { BUCKET_NAME: bucket, FILE_PATH: srcPath, DEST_FILE_PATH: destPath } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.uploadFileToBucket({
        bucket: parsers.autocomplete(bucket),
        srcPath: parsers.string(srcPath),
        destPath: parsers.string(destPath)
    });
}

async function deleteBucket(action, settings){
    const { BUCKET_NAME: bucket, RECURSIVELY: recursively } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.deleteBucket({
        bucket: parsers.autocomplete(bucket),
        recursively: parsers.boolean(recursively)
    });
}

async function deleteObject(action, settings){
    const { BUCKET_NAME: bucket, OBJECT_NAME: path, RECURSIVELY: recursively } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.deleteObject({
        bucket: parsers.autocomplete(bucket),
        path: parsers.string(path),
        recursively: parsers.boolean(recursively)
    });
}

async function managePublicAccessBlock(action, settings){
    const { BUCKET_NAME: bucket, BlockPublicAcls: blockPublicAcls, 
        BlockPublicPolicy: blockPublicPolicy, IgnorePublicAcls: ignorePublicAcls, 
        RestrictPublicBuckets: restrictPublicBuckets } = action.params;

    const client = S3Service.from(action.params, settings);
    return client.managePublicAccessBlock({
        bucket: parsers.autocomplete(bucket),
        blockPublicAcls: parsers.boolean(blockPublicAcls),
        blockPublicPolicy: parsers.boolean(blockPublicPolicy),
        ignorePublicAcls: parsers.boolean(ignorePublicAcls),
        restrictPublicBuckets: parsers.boolean(restrictPublicBuckets)
    });
}

async function putBucketAcl(action, settings){
    const { BUCKET_NAME: bucket, objGrantType, aclGrantType, URI: groups, userID: users,
        emailAddress: emails, grantToSignedUser, dontOverwrite } = action.params;
    
    const client = S3Service.from(action.params, settings);
    return client.putBucketAcl({
        bucket: parsers.autocomplete(bucket),
        objGrantType: objGrantType,
        aclGrantType: aclGrantType,
        groups: parsers.array(groups),
        users: parsers.array(users),
        emails: parsers.array(emails),
        grantToSignedUser: parsers.boolean(grantToSignedUser),
        dontOverwrite: parsers.boolean(dontOverwrite)
    });
}

async function putCannedACL(action, settings){
    const { BUCKET_NAME: bucket, ACL } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.putCannedACL({
        bucket: parsers.autocomplete(bucket),
        ACL
    });
}

async function putBucketVersioning(action, settings){
    const { bucketName: bucket, status, mfaDelete, mfa } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.putBucketVersioning({
        bucket: parsers.autocomplete(bucket),
        status: status,
        mfaDelete: mfaDelete,
        mfa: parsers.string(mfa)
    });
}

async function putBucketPolicy(action, settings){
    const { bucketName: bucket, policy } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.putBucketPolicy({
        bucket: parsers.autocomplete(bucket),
        policy: parsers.object(policy)
    });
}

async function getBucketPolicy(action, settings){
    const { bucketName: bucket } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.getBucketPolicy({
        bucket: parsers.autocomplete(bucket)
    });
}

async function deleteBucketPolicy(action, settings){
    const { bucketName: bucket } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.deleteBucketPolicy({
        bucket: parsers.autocomplete(bucket)
    });
}

async function putBucketLogging(action, settings){
    const { bucketName: srcBucket, disableLogging, targetBucket, targetPrefix, 
        permissionType, groupUris: groups, userIds: users, emails, 
        grantToSignedUser, dontOverwrite} = action.params;
    
    const client = S3Service.from(action.params, settings);
    return client.putBucketLogging({
        srcBucket: parsers.autocomplete(srcBucket),
        disableLogging: parsers.boolean(disableLogging),
        targetBucket: parsers.autocomplete(targetBucket),
        targetPrefix: parsers.string(targetPrefix),
        permissionType: permissionType,
        groups: parsers.array(groups),
        users: parsers.array(users),
        emails: parsers.array(emails),
        grantToSignedUser: parsers.boolean(grantToSignedUser),
        dontOverwrite: parsers.boolean(dontOverwrite)
    });
}

async function putBucketEncryption(action, settings){
    const { bucketName: bucket, sseAlgo, kmsMasterKey, bucketKeyEnabled } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.putBucketEncryption({
        bucket: parsers.autocomplete(bucket),
        kmsMasterKey: parsers.autocomplete(kmsMasterKey),
        bucketKeyEnabled: parsers.boolean(bucketKeyEnabled),
        sseAlgo
    });
}

async function putBucketWebsite(action, settings){
    const { bucket, errorDocument, indexDocument, routingRules } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.putBucketWebsite({
        bucket: parsers.autocomplete(bucket),
        errorDocument: parsers.string(errorDocument),
        indexDocument: parsers.string(indexDocument),
        routingRules: parsers.string(routingRules)
    });
}

async function putBucketWebsiteRedirect(action, settings){
    const { bucket, redirectTo, redirectProtocol } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.putBucketWebsiteRedirect({
        bucket: parsers.autocomplete(bucket),
        redirectTo: parsers.string(redirectTo),
        redirectProtocol
    });
}

async function deleteBucketWebsite(action, settings){
    const { bucket } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.deleteBucketWebsite({
        bucket: parsers.autocomplete(bucket)
    });
}

async function getBucketWebsite(action, settings){
    const { bucket } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.getBucketWebsite({
        bucket: parsers.autocomplete(bucket)
    });
} 

async function listBuckets(action, settings){
    const client = S3Service.from(action.params, settings);
    return client.listBuckets();
}

async function listObjectsInBucket(action, settings){
    const { BUCKET_NAME: bucket, prefix, maxResults, nextToken } = action.params;
    const client = S3Service.from(action.params, settings);
    return client.listObjectsInBucket({
        bucket: parsers.autocomplete(bucket),
        prefix: parsers.string(prefix),
        maxResults: parsers.number(maxResults),
        nextToken: parsers.string(nextToken)
    });
}

module.exports = {
	createBucket,
	uploadFileToBucket,
	deleteBucket,
	deleteObject,
	managePublicAccessBlock,
	putBucketAcl,
	putCannedACL,
	putBucketVersioning,
	putBucketPolicy,
	getBucketPolicy,
	deleteBucketPolicy,
	putBucketLogging,
	putBucketEncryption,
	putBucketWebsite,
	putBucketWebsiteRedirect,
	deleteBucketWebsite,
	getBucketWebsite,
    listBuckets,
	listObjectsInBucket,
    // Autocomplete Functions
    ...require("./autocomplete")
}
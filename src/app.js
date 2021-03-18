#!/usr/bin/env node

let aws = require("aws-sdk");
const { listRegions } = require('./autocomplete');

/// Helpers

function updateAwsCreds(action, settings){
    aws.config.update({
        region: action.params.REGION.id,
        "accessKeyId": action.params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
        "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY 
    });
}

function getAwsClient(action, settings){
    const keyId = action.params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID;
    const secret = action.params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY;
    let config = {
        accessKeyId: keyId,
        secretAccessKey: secret
    }
    if (action.params.REGION){
        config.region = action.params.REGION.id
    }
    return new aws.S3(config);
}

const GRANTEE_TYPE_TO_FIELD = {
    "CanonicalUser": "ID",
    "AmazonCustomerByEmail": "EmailAddress",
    "Group": "URI"
}
function addGrantees(text, granteeType, granteesArr){
    const valField = GRANTEE_TYPE_TO_FIELD[granteeType];
    text.split('\n').forEach((granteeVal) => {
        const fixed = granteeVal.trim();
        if (fixed){
            let granteeObj = {
                Type: granteeType
            }
            granteeObj[valField] = fixed;
            granteesArr.push(granteeObj);
        }
    });
}
// Main methods

async function listBuckets(action, settings) {
    updateAwsCreds(action, settings);
    const s3 = new aws.S3();
    return new Promise((resolve, reject) => {
        s3.listBuckets((err, data) => {
            if (err)
                return reject(err);
            return resolve(data);
        });
    });
}

function createBucket(action,settings) {
    updateAwsCreds(action, settings);

    const bucketParam = {
        Bucket: action.params.BUCKET_NAME
    };

    const s3 = new aws.S3();
    return new Promise((resolve, reject) => {
        s3.createBucket(bucketParam, (error, data) => {
            if (error)
                return reject({ "err": error });
            return resolve(data);
        });
    });
}

function deleteBucket(action,settings) {
    updateAwsCreds(action, settings);

    const bucketParam = {
        Bucket: action.params.BUCKET_NAME
    };

    const s3 = new aws.S3();
    return new Promise((resolve, reject) => {
        s3.deleteBucket(bucketParam, (error, data) => {
            if (error)
                return reject({ "err": error });
            return resolve(data);
        });
    });
}

function uploadFileToBucket(action,settings) {
    updateAwsCreds(action, settings);

    const filePath = action.params.FILE_PATH;
    const fs = require('fs');
    const fileStream = fs.createReadStream(filePath);

    let uploadParams = {
        Bucket: action.params.BUCKET_NAME,
        Key: '',
        Body: '',
        Key: action.params.DEST_FILE_PATH,
        Body: ""
    };
    const s3 = new aws.S3();

    return new Promise((resolve, reject) => {
        fileStream.on('error', function(err) {
            return reject("Error reading file");
        });
        fileStream.on('data', (chunk) => { 
            uploadParams.Body += chunk;
        });
        fileStream.on('end', () => { 
            s3.upload(uploadParams, (err, data) => {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    });
}

function listObjects(action,settings) {
    updateAwsCreds(action, settings);

    const bucketParam = {
        Bucket: action.params.BUCKET_NAME
    };

    const s3 = new aws.S3();
    return new Promise((resolve, reject) => {
        s3.deleteBucket(bucketParam, (err, data) => {
            if (err)
                return reject(err);
            return resolve(data);
        });
    });
}


function deleteObject(action,settings) {
    updateAwsCreds(action, settings);

    const params = {
        Bucket: action.params.BUCKET_NAME,
        Key: action.params.OBJECT_NAME
    };

    const s3 = new aws.S3();
    return new Promise((resolve, reject) => {
        s3.deleteObject(params, (err, data) => {
            if (err)
                return reject(err);
            return resolve(data);
        });
    });
}

function managePublicAccessBlock(action, settings) {
    updateAwsCreds(action, settings);

    const jBlockPublicAcls = JSON.parse(action.params.BlockPublicAcls);
    const jBlockPublicPolicy = JSON.parse(action.params.BlockPublicPolicy);
    const jIgnorePublicAcls = JSON.parse(action.params.IgnorePublicAcls);
    const jRestrictPublicBuckets = JSON.parse(action.params.RestrictPublicBuckets)
    const params = {
        Bucket: action.params.BUCKET_NAME, /* required */
        PublicAccessBlockConfiguration: { /* required */
          BlockPublicAcls: jBlockPublicAcls,
          BlockPublicPolicy: jBlockPublicPolicy,
          IgnorePublicAcls: jIgnorePublicAcls,
          RestrictPublicBuckets: jRestrictPublicBuckets
        },
        ContentMD5: action.params.ContentMD5,
        ExpectedBucketOwner: action.params.ExpectedBucketOwner
    };
    const s3 = new aws.S3();
    return new Promise((resolve, reject) => {
        s3.putPublicAccessBlock(params, (err, data) => {
            if (err) 
                return reject ({"err": err}); // an error occurred
            return resolve (data) // successful response
          })
    });
}

async function putBucketAcl(action, settings) {
    let params = {
        Bucket: action.params.BUCKET_NAME
    };
    
    const uri = (action.params.URI || "").trim();
    const userID = (action.params.userID || "").trim();
    const emailAddress = (action.params.emailAddress || "").trim();
    const accessString = uri            ?   `uri=${uri}` :
                         userID         ?   `id=${userID}` :
                         emailAddress   ?   `emailAddress=${emailAddress}` : "";
    if (!accessString){
        throw "You must specify one of the following: Group URI/User ID/User Email Address";
    }
    const objGrantType = action.params.objGrantType;
    const aclGrantType = action.params.aclGrantType;
    let grantTypes = [];
    if (aclGrantType == "readWrite" && objGrantType == "readWrite"){
        grantTypes.push("GrantFullControl");
    }
    else{
        if (objGrantType === "readWrite"){
            grantTypes = ["GrantRead", "GrantWrite"];
        }
        else if (objGrantType){
            grantTypes.push(objGrantType);
        }
        if (aclGrantType === "readWrite"){
            grantTypes.push("GrantReadACP")
            grantTypes.push("GrantWriteACP");
        }
        else if (aclGrantType){
            grantTypes.push(aclGrantType);
        }
        if (grantTypes.length === 0){
            throw "You must specify at least one of the following: Object Grant Type/ACL Grant Type"
        }
    }
    grantTypes.forEach(function(grantType){
        params[grantType] = accessString;
    })
    
    const s3 = getAwsClient(action, settings);
    return new Promise((resolve, reject) => {
        s3.putBucketAcl(params, function(err, data) {
            if (err) return reject(err);
            else     return resolve(data);
        });
    });
}

async function putCannedACL(action, settings) {
    const params = {
        Bucket: action.params.BUCKET_NAME,
        ACL: action.params.ACL
    };
    const s3 = getAwsClient(action, settings);
    return new Promise((resolve, reject) => {
        s3.putBucketAcl(params, function(err, data) {
            if (err) return reject(err);
            else     return resolve(data);
        });
    });
}

async function putBucketVersioning(action, settings){
    if (action.params.mfaDelete === "Enabled" && !action.params.mfa){
       throw "MFA must be provided when enabling MFA Delete"; 
    }
    const params = {
        Bucket: action.params.bucketName, /* required */
        VersioningConfiguration: {
            MFADelete: action.params.mfaDelete || "Disabled",
            Status: action.params.status
        },
        MFA: action.params.mfa
    }
    const s3 = getAwsClient(action, settings);
    return new Promise((resolve, reject) => {
        s3.putBucketVersioning(params, function(err, data) {
            if (err) return reject(err);
            else     return resolve(data);
        });
    });
}

async function putBucketPolicy(action, settings){
    let policy = action.params.policy;
    if (typeof policy === "object"){
        policy = JSON.stringify(policy);
    }
    else if (typeof policy !== "string"){
        throw "Policy must be either a JSON string or an object from code";
    }
    const params = {
        Bucket: action.params.bucketName, /* required */
        Policy: policy
    }
    const s3 = getAwsClient(action, settings);
    return new Promise((resolve, reject) => {
        s3.putBucketPolicy(params, function(err, data) {
            if (err) return reject(err);
            else     return resolve(data);
        });
    });
}

async function putBucketLogging(action, settings){
    const loggingEnabled = !action.params.disableLogging;
    let params = {
        Bucket: action.params.bucketName, /* required */
        BucketLoggingStatus: {}
    }
    if (loggingEnabled){
        const targetBucket = (action.params.targetBucket || "").trim();
        const targetPrefix = (action.params.targetPrefix || "").trim();
        if (!targetBucket || !targetPrefix){
            throw "When enablig logging you must provide Target Bucket and Target Prefix";
        }
        
        // sets the same permission type to all grantees 
        const permissionType = action.params.permissionType || "READ";
        
        let grantees = [];
        addGrantees(action.params.groupUris || "", "Group", grantees);
        addGrantees(action.params.userIds || "", "CanonicalUser", grantees);
        addGrantees(action.params.emails || "", "AmazonCustomerByEmail", grantees);

        if (grantees.length === 0){
            throw "You must provide at least one user or group to give permmision to the log files"
        }
        params.BucketLoggingStatus.LoggingEnabled = {
            TargetBucket: targetBucket,
            TargetPrefix: targetPrefix,
            TargetGrants: grantees.map((grantee) => {
                return {
                    Permission: permissionType,
                    Grantee: grantee
                }
            })
        };
    }
    const s3 = getAwsClient(action, settings);
    return new Promise((resolve, reject) => {
        s3.putBucketLogging(params, function(err, data) {
            if (err) return reject(err);
            else     return resolve(data);
        });
    });
}

async function putBucketEncryption(action, settings){
    const sseAlgo = action.params.sseAlgo;
    if (!sseAlgo){
        throw "SSE Algorithem was not provided";
    }
    const bucketKeyEnabled = action.params.bucketKeyEnabled || false;
    const kmsMasterKey = (action.params.kmsMasterKey || "").trim();
    if (kmsMasterKey && sseAlgo !== "aws:kms"){
        throw "KMS Master Key ID is allowed only if SSE Algorithem is AWS KMS";
    }
    if (!kmsMasterKey && sseAlgo === "aws:kms"){
        throw "Must provide KMS Master Key ID with AWS KMS Encryption"
    }
    let params = {
        Bucket: action.params.bucketName, /* required */
        ServerSideEncryptionConfiguration: {
            Rules: []
        }
    }
    if (sseAlgo !== "none"){
        let encryption = {
            SSEAlgorithm: sseAlgo
        };
        if (sseAlgo == "aws:kms"){
            encryption.KMSMasterKeyID = kmsMasterKey
        }
        params.ServerSideEncryptionConfiguration.Rules.push({
            ApplyServerSideEncryptionByDefault: encryption,
            BucketKeyEnabled: bucketKeyEnabled
        });
    }
    const s3 = getAwsClient(action, settings);
    return new Promise((resolve, reject) => {
        s3.putBucketEncryption(params, function(err, data) {
            if (err) return reject(err);
            else     return resolve(data);
        });
    });
}

async function getBucketPolicy(action, settings){
    const params = {
        Bucket: action.params.bucketName
    }
    const s3 = getAwsClient(action, settings);
    return new Promise((resolve, reject) => {
        s3.getBucketPolicy(params, function(err, data) {
            if (err) return reject(err);
            else     return resolve(data);
        });
    });
}

async function deleteBucketPolicy(action, settings){
    const params = {
        Bucket: action.params.bucketName, /* required */
    }
    const s3 = getAwsClient(action, settings);
    return new Promise((resolve, reject) => {
        s3.deleteBucketPolicy(params, function(err, data) {
            if (err) return reject(err);
            else     return resolve(data);
        });
    });
}

module.exports = {
    listBuckets: listBuckets,
    createBucket: createBucket,
    uploadFileToBucket: uploadFileToBucket,
    deleteBucket: deleteBucket,
    listObjectsInBucket: listObjects,
    deleteObject: deleteObject,
    managePublicAccessBlock: managePublicAccessBlock,
    putBucketAcl: putBucketAcl,
    putCannedACL: putCannedACL,
    putBucketVersioning: putBucketVersioning,
    putBucketLogging: putBucketLogging,
    putBucketEncryption: putBucketEncryption,
    putBucketPolicy: putBucketPolicy,
    getBucketPolicy: getBucketPolicy,
    deleteBucketPolicy: deleteBucketPolicy,
    //autocomplete
    listRegions
};
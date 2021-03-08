#!/usr/bin/env node

let aws = require("aws-sdk");
const { listRegions } = require('./autocomplete');

function updateAwsCreds(action, settings){
    aws.config.update({
        region: action.params.REGION.id,
        "accessKeyId": action.params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
        "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY 
    });
}

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

function putBucketAcl(action, settings) {
    updateAwsCreds(action, settings);

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
    
    const s3 = new aws.S3();
    return new Promise((resolve, reject) => {
        s3.putBucketAcl(params, function(err, data) {
            if (err) {
                return reject(err);
            }
            return resolve (data);
        });
    });
}

function putCannedACL(action, settings) {
    updateAwsCreds(action, settings);

    let params = {
        Bucket: action.params.BUCKET_NAME,
        ACL: action.params.ACL
    };
    const s3 = new aws.S3();
    return new Promise((resolve, reject) => {
        s3.putBucketAcl(params, function(err, data) {
            if (err) {
                return reject(err);
            }
            return resolve (data);
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
    //autocomplete
    listRegions
};
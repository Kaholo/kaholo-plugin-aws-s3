#!/usr/bin/env node

let aws = require("aws-sdk");

function listBuckets(action,settings) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY 
        });

        let s3 = new aws.S3();
        s3.listBuckets((error, data) => {
            if (error)
                return reject({ "err": error });
            return resolve(data);
        });
    });
}

function createBucket(action,settings) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY 
        });

        let bucketParam = {
            Bucket: action.params.BUCKET_NAME
        };

        let s3 = new aws.S3();
        s3.createBucket(bucketParam, (error, data) => {
            if (error)
                return reject({ "err": error });
            return resolve(data);
        });
    });
}

function deleteBucket(action,settings) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY 
        });

        let bucketParam = {
            Bucket: action.params.BUCKET_NAME
        };

        let s3 = new aws.S3();
        s3.deleteBucket(bucketParam, (error, data) => {
            if (error)
                return reject({ "err": error });
            return resolve(data);
        });
    });
}

function uploadFileToBucket(action,settings) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY 
        });

        let uploadParams = {
            Bucket: action.params.BUCKET_NAME,
            Key: '',
            Body: '',
            Key : action.params.DEST_FILE_PATH
        };

        let filePath = action.params.FILE_PATH;
        let fs = require('fs');
        let fileStream = fs.createReadStream(filePath);
        fileStream.on('error', function (err) {
            return reject("Error reading file", err);
        });
        uploadParams.Body = fileStream;

        let s3 = new aws.S3();
        s3.upload(uploadParams, (error, data) => {
            if (error)
                return reject({ "err": error });
            return resolve(data);
        });
        s3.deleteobj
    });
}

function listObjects(action,settings) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY 
        });

        let bucketParam = {
            Bucket: action.params.BUCKET_NAME
        };

        let s3 = new aws.S3();
        s3.deleteBucket(bucketParam, (error, data) => {
            if (error)
                return reject({ "err": error });
            return resolve(data);
        });
    });
}


function deleteObject(action,settings) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY 
        });

        let params = {
            Bucket: action.params.BUCKET_NAME,
            Key: action.params.OBJECT_NAME
        };


        let s3 = new aws.S3();
        s3.deleteObject(params, (error, data) => {
            if (error)
                return reject({ "err": error });
            return resolve(data);
        });
    });
}

function managePublicAccessBlock(action, settings) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            "region":action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID || settings.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY || settings.AWS_SECRET_ACCESS_KEY 
        });
        let jBlockPublicAcls = JSON.parse(action.params.BlockPublicAcls);
        let jBlockPublicPolicy = JSON.parse(action.params.BlockPublicPolicy);
        let jIgnorePublicAcls = JSON.parse(action.params.IgnorePublicAcls);
        let jRestrictPublicBuckets = JSON.parse(action.params.RestrictPublicBuckets)
        var params = {
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
        let s3 = new aws.S3();
        s3.putPublicAccessBlock(params, (err, data) => {
            if (err) 
                return reject ({"err": err}); // an error occurred
            return resolve (data) // successful response
          })
    });
}

module.exports = {
    listBuckets: listBuckets,
    createBucket: createBucket,
    uploadFileToBucket: uploadFileToBucket,
    deleteBucket: deleteBucket,
    listObjectsInBucket: listObjects,
    deleteObject: deleteObject,
    managePublicAccessBlock: managePublicAccessBlock
};
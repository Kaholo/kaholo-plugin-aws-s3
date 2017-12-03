#!/usr/bin/env node

let aws = require("aws-sdk");

function listBuckets(action) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY
        });

        let s3 = new aws.S3();
        s3.listBuckets((error, data) => {
            if (error)
                return reject({ "err": error });
            return resolve(data);
        });
    });
}

function createBucket(action) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY
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

function deleteBucket(action) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY
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

function uploadFileToBucket(action) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY
        });

        let uploadParams = {
            Bucket: action.params.BUCKET_NAME,
            Key: '',
            Body: ''
        };

        let filePath = action.params.FILE_PATH;
        let fs = require('fs');
        let fileStream = fs.createReadStream(filePath);
        fileStream.on('error', function (err) {
            return reject("Error reading file", err);
        });
        uploadParams.Body = fileStream;

        let path = require('path');
        uploadParams.Key = path.basename(filePath);

        let s3 = new aws.S3();
        s3.upload(uploadParams, (error, data) => {
            if (error)
                return reject({ "err": error });
            return resolve(data);
        });
        s3.deleteobj
    });
}

function listObjects(action) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY
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


function deleteObject(action) {
    return new Promise((resolve, reject) => {
        aws.config.update({
            region: action.params.REGION,
            "accessKeyId": action.params.AWS_ACCESS_KEY_ID,
            "secretAccessKey": action.params.AWS_SECRET_ACCESS_KEY
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

let functions = {
    listBuckets: listBuckets,
    createBucket: createBucket,
    uploadFileToBucket: uploadFileToBucket,
    deleteBucket: deleteBucket,
    listObjectsInBucket: listObjects,
    deleteObject: deleteObject
};

function main(argv) {
    if (argv.length < 3) {
        console.log({ err: "not enough parameters" });
        // Invalid Argument
        // Either an unknown option was specified, or an option requiring a value was provided without a value.
        process.exit(9);
    }
    let action = JSON.parse(argv[2]);
    functions[action.method.name](action)
        .then((res) => {
            console.log(res);
            process.exit(0); // Success
        }).catch((err) => {
            console.log("An error occured", err);
            // Uncaught Fatal Exception
            // There was an uncaught exception, and it was not handled by a domain or an 'uncaughtException' event handler.
            process.exit(1); // Failure
        });
}

main(process.argv);

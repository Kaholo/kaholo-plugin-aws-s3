let aws = require("aws-sdk");

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

function getAwsCallback(resolve, reject){
    return (err, data) => {
        if (err) return reject(err);
        return resolve(data);
    }
}

module.exports = { 
    getAwsClient,
    addGrantees,
    getAwsCallback
}
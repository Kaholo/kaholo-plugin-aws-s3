const _ = require("lodash");
const fs = require("fs");
const { removeUndefinedAndEmpty } = require("kaholo-aws-plugin/helpers");

const GRANTEE_TYPE_TO_FIELD = {
  CanonicalUser: "ID",
  AmazonCustomerByEmail: "EmailAddress",
  EmailAddress: "EmailAddress",
  Group: "URI",
};

function getGranteeId(grant) {
  return grant.Grantee[GRANTEE_TYPE_TO_FIELD[grant.Grantee.Type]];
}

function parseGrantee(grantee, granteeType) {
  const valField = GRANTEE_TYPE_TO_FIELD[granteeType];
  return {
    Type: granteeType,
    [valField]: grantee,
  };
}

function parseGrantees(grantees, granteeType) {
  return grantees.map((grantee) => parseGrantee(grantee, granteeType));
}

function getGrants(grantees, permissionTypes) {
  return _.flatten(permissionTypes.map((permissionType) => grantees.map((grantee) => ({
    Grantee: grantee,
    Permission: permissionType,
  }))));
}

function combineGrants(currentGrants, newGrants) {
  if (currentGrants.length === 0) { return newGrants; }

  const grantsAreEqual = (a, b) => a.Permission === b.Permission
        && a.Grantee.Type === b.Grantee.Type
        && getGranteeId(a) === getGranteeId(b);

  const applicableNewGrants = newGrants.reduce(
    (acc, current) => (currentGrants.every((grant) => !grantsAreEqual(grant, current))
      ? [...acc, current]
      : acc),
    [],
  );

  return [
    ...currentGrants, ...applicableNewGrants,
  ];
}

function resolveACLGrantType(aclGrantType) {
  switch (aclGrantType) {
    case "readWrite":
      return ["READ_ACP", "WRITE_ACP"];
    case "GrantReadACP":
      return ["READ_ACP"];
    case "GrantWriteACP":
      return ["WRITE_ACP"];
    case "":
    case "none":
      return [];
    default:
      return [aclGrantType];
  }
}

function resolveObjectGrantType(objectGrantType) {
  switch (objectGrantType) {
    case "readWrite":
      return ["READ", "WRITE"];
    case "GrantRead":
      return ["READ"];
    case "GrantWrite":
      return ["WRITE"];
    case "":
    case "none":
      return [];
    default:
      return [objectGrantType];
  }
}

function resolveBucketAclPermissions(params) {
  if (params.aclGrantType === "readWrite" && params.objGrantType === "readWrite") {
    return ["FULL_CONTROL"];
  }

  const result = _.concat(
    resolveObjectGrantType(params.objGrantType),
    resolveACLGrantType(params.aclGrantType),
  );

  if (_.isEmpty(result)) {
    throw new Error("You must specify at least one of the following: Object Grant Type/ACL Grant Type");
  }

  return result;
}

async function readFile(filepath) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Couldn't find the file at ${filepath}`);
  }
  const filestream = fs.createReadStream(filepath);

  let body = "";
  return new Promise((resolve, reject) => {
    filestream.on("error", (err) => {
      reject(new Error(`Error reading source file: ${err.message}`));
    });
    filestream.on("data", (chunk) => {
      body += chunk;
    });
    filestream.on("end", () => {
      resolve(body);
    });
  });
}

async function getUserId(client) {
  return (await client.listBuckets().promise()).Owner.ID;
}

async function getNewGrantees(client, {
  groupUris, userIds, emails, grantToSignedUser,
}) {
  const newGrantees = [
    ...parseGrantees(groupUris || [], "Group"),
    ...parseGrantees(userIds || [], "CanonicalUser"),
    ...parseGrantees(emails || [], "AmazonCustomerByEmail"),
  ];

  if (grantToSignedUser && !_.isNil(client)) {
    newGrantees.push(parseGrantee(await getUserId(client), "CanonicalUser"));
  }

  return newGrantees;
}

async function emptyDirectory(client, bucket, directory = "") {
  let pathToDelete = directory;
  if (!_.endsWith(directory, "/")) {
    pathToDelete = `${directory}/`;
  }
  const listPayload = removeUndefinedAndEmpty({
    Bucket: bucket,
    Prefix: pathToDelete,
  });

  const listedObjects = await client.listObjectsV2(listPayload).promise();
  if (listedObjects.Contents.length === 0) {
    return;
  }

  const deletePayload = {
    Bucket: bucket,
    Delete: { Objects: [] },
  };

  listedObjects.Contents.forEach(({ Key }) => {
    deletePayload.Delete.Objects.push({ Key });
  });

  await client.deleteObjects(deletePayload).promise();
  if (listedObjects.IsTruncated) {
    await emptyDirectory(bucket, directory);
  }
}

function sanitizeS3Path(path, filename) {
  if (!path) {
    return filename;
  }
  let resultPath = path.trim();
  if (path === "" || path === "/") {
    return filename;
  }
  if (_.startsWith(resultPath, "/")) {
    resultPath = resultPath.substring(1);
  }
  if (_.endsWith(resultPath, "/")) {
    resultPath += filename;
  }
  return resultPath;
}

module.exports = {
  readFile,
  resolveBucketAclPermissions,
  getNewGrantees,
  getGrants,
  combineGrants,
  emptyDirectory,
  sanitizeS3Path,
};

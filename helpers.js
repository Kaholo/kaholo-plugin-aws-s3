const _ = require("lodash");
const { removeUndefinedAndEmpty } = require("@kaholo/aws-plugin-library").helpers;

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
  if (currentGrants.length === 0) {
    return newGrants;
  }

  const grantsAreEqual = (a, b) => a.Permission === b.Permission
        && a.Grantee.Type === b.Grantee.Type
        && getGranteeId(a) === getGranteeId(b);

  const applicableNewGrants = newGrants.filter(
    (newGrant) => currentGrants.every((currentGrant) => !grantsAreEqual(currentGrant, newGrant)),
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

async function emptyDirectory(client, bucket, prefix = "") {
  const listPayload = removeUndefinedAndEmpty({
    Bucket: bucket,
    Prefix: prefix,
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
    await emptyDirectory(bucket, prefix);
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
  resolveBucketAclPermissions,
  getNewGrantees,
  getGrants,
  combineGrants,
  emptyDirectory,
  sanitizeS3Path,
};

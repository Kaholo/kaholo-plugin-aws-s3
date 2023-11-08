const _ = require("lodash");
const fs = require("fs/promises");
const { removeUndefinedAndEmpty } = require("@kaholo/aws-plugin-library").helpers;
const {
  ListObjectsV2Command,
  DeleteObjectsCommand,
  ListBucketsCommand,
} = require("@aws-sdk/client-s3");

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
  const { Owner } = await client.send(new ListBucketsCommand());
  return Owner.ID;
}

async function getNewGrantees(client, {
  groupUris,
  userIds,
  emails,
  grantToSignedUser,
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

async function listObjectsRecursively(
  client,
  listPayload,
  continuationToken = null,
) {
  const resolvedListPayload = removeUndefinedAndEmpty({
    ...listPayload,
    ContinuationToken: continuationToken,
  });
  const listedObjects = await client.send(new ListObjectsV2Command(resolvedListPayload));

  if (listedObjects.KeyCount === 0) {
    return [];
  }
  if (!listedObjects.IsTruncated) {
    return listedObjects.Contents;
  }

  const recursiveResult = await listObjectsRecursively(
    client,
    listPayload,
    listedObjects.NextContinuationToken,
  );
  return [...listedObjects.Contents, ...recursiveResult];
}

async function emptyDirectory(client, bucket, prefix = "") {
  const listedObjects = await listObjectsRecursively(
    client,
    {
      Bucket: bucket,
      Prefix: prefix,
    },
  );

  if (listedObjects.length === 0) {
    return;
  }

  const deletePayload = {
    Bucket: bucket,
    Delete: {
      Objects: listedObjects.map(({ Key }) => ({ Key })),
    },
  };
  await client.send(new DeleteObjectsCommand(deletePayload));
}

function appendPathSeparatorIfNecessary(objectPath) {
  if (!objectPath) {
    return "";
  }

  return objectPath.endsWith("/") ? objectPath : `${objectPath}/`;
}

async function assertPathAvailability(fsPath) {
  let pathStat;
  try {
    pathStat = await fs.stat(fsPath);
  } catch {
    return true;
  }

  if (pathStat.isDirectory()) {
    throw new Error("PATH_IS_DIRECTORY");
  }
  if (pathStat.isFile()) {
    throw new Error("PATH_IS_FILE");
  }

  return true;
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

async function ensureDirectory(dirPath) {
  let pathStat;
  try {
    pathStat = await fs.stat(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  }

  if (!pathStat.isDirectory()) {
    throw new Error(`Path "${dirPath}" exists and is not a directory`);
  }

  return true;
}

module.exports = {
  ensureDirectory,
  assertPathAvailability,
  listObjectsRecursively,
  resolveBucketAclPermissions,
  appendPathSeparatorIfNecessary,
  getNewGrantees,
  getGrants,
  combineGrants,
  emptyDirectory,
  sanitizeS3Path,
};

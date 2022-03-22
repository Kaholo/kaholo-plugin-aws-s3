const GRANTEE_TYPE_TO_FIELD = {
  CanonicalUser: "ID",
  AmazonCustomerByEmail: "EmailAddress",
  Group: "URI",
};

function combineGrants(currentGrants, newGrants) {
  if (currentGrants.length === 0) { return newGrants; }
  return currentGrants.concat(newGrants.filter((newGrant) => !currentGrants.find((grant) => {
    if (grant.Permission !== newGrant.Permission) { return false; }
    if (grant.Grantee.Type !== newGrant.Grantee.Type) { return false; }
    const valField = GRANTEE_TYPE_TO_FIELD[grant.Grantee.Type];
    if (grant.Grantee[valField] !== newGrant.Grantee[valField]) { return false; }
    return true;
  })));
}

function parseGrantees(grantees, granteeType) {
  return grantees.map((grantee) => parseGrantee(grantee, granteeType));
}

function getGrants(grantees, permissionTypes) {
  return permissionTypes.map((permissionType) => grantees.map((grantee) => ({
    Grantee: grantee,
    Permission: permissionType,
  }))).flat();
}

function parseGrantee(grantee, granteeType) {
  const valField = GRANTEE_TYPE_TO_FIELD[granteeType];
  const granteeObj = {
    Type: granteeType,
  };
  granteeObj[valField] = grantee;
  return granteeObj;
}

function getAwsCallback(resolve, reject) {
  return (err, data) => {
    if (err) { return reject(err); }
    return resolve(data);
  };
}

function removeUndefinedAndEmpty(obj, removeSpecial) {
  const resolvedObj = obj;
  Object.entries(resolvedObj).forEach(([key, value]) => {
    if (value === undefined) {
      delete resolvedObj[key];
    }
    if (removeSpecial && typeof (value) === "string") {
      delete resolvedObj[key];
    }
    if (Array.isArray(value) && value.length === 0) {
      delete resolvedObj[key];
    }
    if (typeof (value) === "object") {
      removeUndefinedAndEmpty(value);
      if (Object.keys(value).length === 0) {
        delete resolvedObj[key];
      }
    }
  });
  return resolvedObj;
}

module.exports = {
  removeUndefinedAndEmpty,
  parseGrantees,
  parseGrantee,
  getAwsCallback,
  getGrants,
  combineGrants,
};

function prepareCreateBucketPayload(params, region) {
  return {
    Bucket: params.BUCKET_NAME,
    CreateBucketConfiguration: {
      LocationConstraint: region,
    },
  };
}

function prepareListObjectsPayload(params) {
  return {
    Bucket: params.BUCKET_NAME,
    Prefix: params.prefix,
  };
}

function prepareManagePublicAccessBlockPayload(params) {
  return {
    Bucket: params.BUCKET_NAME,
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: params.BlockPublicAcls || false,
      BlockPublicPolicy: params.BlockPublicPolicy || false,
      IgnorePublicAcls: params.IgnorePublicAcls || false,
      RestrictPublicBuckets: params.RestrictPublicBuckets || false,
    },
  };
}

function preparePutCannedAclPayload(params) {
  return {
    Bucket: params.BUCKET_NAME,
    ACL: params.ACL,
  };
}

function preparePutBucketVersioningPayload(params) {
  if (params.MFADelete === "Enabled" && !params.MFA) {
    throw new Error("MFA cannot be empty if MFA Delete is enabled!");
  }

  return {
    Bucket: params.bucketName,
    MFA: params.mfa,
    VersioningConfiguration: {
      MFADelete: params.mfaDelete || "Disabled",
      Status: params.status,
    },
  };
}

function prepareGetBucketPolicyPayload(params) {
  return {
    Bucket: params.bucketName,
  };
}

function prepareDeleteBucketPolicyPayload(params) {
  return {
    Bucket: params.bucketName,
  };
}

function preparePutBucketWebsitePayload(params) {
  return {
    Bucket: params.bucket,
    WebsiteConfiguration: {
      ErrorDocument: {
        Key: params.errorDocument,
      },
      IndexDocument: {
        Suffix: params.indexDocument,
      },
      RoutingRules: params.routingRules && params.routingRules.length > 0
        ? params.routingRules
        : undefined,
    },
  };
}

function preparePutBucketWebsiteRedirectPayload(params) {
  return {
    Bucket: params.bucket,
    WebsiteConfiguration: {
      RedirectAllRequestsTo: {
        HostName: params.redirectTo,
        Protocol: params.redirectProtocol,
      },
    },
  };
}

function prepareGetBucketWebsitePayload(params) {
  return {
    Bucket: params.bucket,
  };
}

function prepareDeleteBucketWebsitePayload(params) {
  return {
    Bucket: params.bucket,
  };
}

module.exports = {
  prepareCreateBucketPayload,
  prepareManagePublicAccessBlockPayload,
  preparePutBucketVersioningPayload,
  preparePutBucketWebsitePayload,
  preparePutBucketWebsiteRedirectPayload,
  prepareListObjectsPayload,
  preparePutCannedAclPayload,
  prepareGetBucketPolicyPayload,
  prepareDeleteBucketPolicyPayload,
  prepareGetBucketWebsitePayload,
  prepareDeleteBucketWebsitePayload,
};

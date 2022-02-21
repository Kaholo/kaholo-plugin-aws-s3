// Prepare payload functions
function prepareCreateBucketPayload(params, region) {
  return {
    Bucket: params.Bucket,
    CreateBucketConfiguration: {
      LocationConstraint: region,
    },
  };
}

function prepareManagePublicAccessBlockPayload(params) {
  return {
    Bucket: params.Bucket,
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: params.BlockPublicAcls || false,
      BlockPublicPolicy: params.BlockPublicPolicy || false,
      IgnorePublicAcls: params.IgnorePublicAcls || false,
      RestrictPublicBuckets: params.RestrictPublicBuckets || false,
    },
  };
}

function preparePutBucketVersioningPayload(params) {
  if (params.MFADelete === "Enabled" && !params.MFA) {
    throw new Error("MFA cannot be empty if MFA Delete is enabled!");
  }

  return {
    Bucket: params.Bucket,
    MFA: params.MFA,
    VersioningConfiguration: {
      MFADelete: params.MFADelete || "Disabled",
      Status: params.Status,
    },
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

module.exports = {
  prepareCreateBucketPayload,
  prepareManagePublicAccessBlockPayload,
  preparePutBucketVersioningPayload,
  preparePutBucketWebsitePayload,
  preparePutBucketWebsiteRedirectPayload,
};

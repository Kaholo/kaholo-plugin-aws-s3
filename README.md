# kaholo-plugin-s3
AWS-s3 plugin for Kaholo

This plugin is based on S3 AWS SDK [Documentaion](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)

**Settings**

1. Access Key
2. Secret key

## Method: Buckets list

**Description:**

Returns a list of all buckets owned by the authenticated sender of the request. 
[documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listBuckets-property)

**Parameters:**

1. Access Key
2. Secret key
3. Region

## Method: Create a bucket

**Description:**
Creates a new bucket. 
[Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#createBucket-property)

**Parameters:**

1. Access Key
2. Secret key
3. Region
4. Bucket name

## Method: Upload File

**Description:**
Uploads an arbitrarily sized buffer, blob, or stream, using intelligent concurrent handling of parts if the payload is large enough. 
[Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property)

**Parameters:**

1. Access Key
2. Secret key
3. Region
4. Bucket name
5. File path
6. Des file path


## Method: Delete a bucket

**Description:**
Deletes the bucket. All objects (including all object versions and delete markers) in the bucket must be deleted before the bucket itself can be deleted.
[Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteBucket-property)

**Parameters:**

1. Access Key
2. Secret key
3. Region
4. Bucket name

## Method: Delete an object

**Description:**
Removes the null version (if there is one) of an object and inserts a delete marker, which becomes the latest version of the object. If there isn't a null version, Amazon S3 does not remove any objects.
[Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property)

**Parameters:**

1. Access Key
2. Secret key
3. Region
4. Bucket name
5. Object name

## Method: List bucket's objects

**Description:**


**Parameters:**

1. Access Key
2. Secret key
3. Region

## Method: Manage Public Access Block
This method will set the permissions of the bucket according to the following [documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putPublicAccessBlock-property)

### Parameters:
1. Access Key (vault) **Optional**
2. Secret key (vault) **Optional**
3. Region (Auto Complete) **Required**
4. Bucket name (string) **Required**
5. BlockPublicAcls (boolean) **Optional**
6. BlockPublicPolicy (boolean) **Optional**
7. IgnorePublicAcls (boolean) **Optional**
8. RestrictPublicBuckets (boolean) **Optional**
9. ContentMD5 (string) **Optional**
10. ExpectedBucketOwner (account Id) **Required**

# Method: Manage Bucket ACL
Grants basic read/write permissions to the specified s3 bucket, to other AWS accounts. Does so according to the method described [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putBucketAcl-property)

### Parameters:
1. Access Key (vault) **Optional**
2. Secret key (vault) **Optional**
3. Region (Auto Complete) **Required**
4. Bucket name (string) **Required**
5. Grant Type (options) **Required**
6. Group URI (string)
7. User ID (string)
8. User Email Address (string)

Notice! You have to provide one of the following: Group URI/User ID/User Email Address


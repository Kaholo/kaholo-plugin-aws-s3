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



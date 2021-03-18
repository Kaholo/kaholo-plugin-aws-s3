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
5. Object Grant Type (options)
5. ACL Grant Type (options)
7. Group URI (string)
8. User ID (string)
9. User Email Address (string)

Notice! You have to provide one(and one only) of the following: Group URI/User ID/User Email Address
Also You have to provide Object Grant Type\ACL Grant Type\Both

# Method: Apply Canned ACL to Bucket
applies canned(prebuilt) ACL to bucket. Does so according to the method described [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putBucketAcl-property), using the 'ACL' parameter.

### Parameters:
1. Access Key (vault) **Optional**
2. Secret key (vault) **Optional**
3. Region (Auto Complete) **Required**
4. Bucket name (string) **Required**
5. Canned ACL Type (options) **Required**

# Method: Manage Bucket Versioning
Sets the versioning state of an existing bucket. Does so according to the method described [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putBucketVersioning-property).

### Parameters:
1. Access Key (vault) **Optional**
2. Secret key (vault) **Optional**
3. Bucket name (string) **Required**
4. Status (Enabled/Disabled) **Required** - The versioning state of the bucket
5. MFA Delete **Optional** - Specifies whether MFA delete is enabled in the bucket versioning configuration. Default is Disabled.
6. MFA **Required with MFA Delete Enabled** - The concatenation of the authentication device's serial number, a space, and the value that is displayed on your authentication device

# Method: Apply Bucket Policy
Applies an Amazon S3 bucket policy to the bucket. Does so according to the method described [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putBucketPolicy-property).

### Parameters:
1. Access Key (vault) **Optional**
2. Secret key (vault) **Optional**
3. Bucket name (string) **Required**
4. Policy (object/JSON string) **Required** - The bucket policy as a JSON string or an object from code.

# Method: Get Bucket Policy
Get the Amazon S3 bucket policy of the bucket. Does so according to the method described [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getBucketPolicy-property).

### Parameters:
1. Access Key (vault) **Optional**
2. Secret key (vault) **Optional**
3. Bucket name (string) **Required**

# Method: Delete Bucket Policy
Deletes the Amazon S3 bucket policy of the bucket. Does so according to the method described [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteBucketPolicy-property).

### Parameters:
1. Access Key (vault) **Optional**
2. Secret key (vault) **Optional**
3. Bucket name (string) **Required**

# Method: Manage Bucket Logging
Set the logging parameters for a bucket and to specify permissions for who can view and modify the logging parameters. Does so according to the method described [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putBucketLogging-property).
**In order for it to work you need to enable in the buckets ACL Read and Write permmision to your S3 log delivery group.**

### Parameters:
1. Access Key (vault) **Optional**
2. Secret key (vault) **Optional**
3. Source Bucket name (string) **Required** - The name of the bucket you want to create the logs for.
4. Disable Logging(boolean) **Optional** - Check this parameter when you want to disable the logging
5. Target Bucket Name (string) **Required for Enabling Logging** - The name of the bucket in which you want to store the logs created.
6. Target Prefix (string)**Required for Enabling Logging** - The prefix to apply to each of the log files names.
7. Permission Type (Read/Write/Full Control) **Optional** - The Kind of permmision to give to whom you give permmision to the 
    logging parameters. Default is Read.
8. Group URIs(text) **Optional** - The URI(s) of the group(s) you want to give permmision to. Seperate each group uri with a new line.
9. User IDs(text) **Optional** - The ID(s) of the user(s) you want to give permmision to. Seperate each user ID with a new line.
10. Email Addresses(text) **Optional** - The email address(es) of the user(s) you want to give permmision to. Seperate each email address 
    with a new line.

* Notice! You need to provide at least one of the following: Group URIs/User IDs/Email Addresses. The permmision specified in the Permmision Type will apply to all users and groups provided inside those parameters.
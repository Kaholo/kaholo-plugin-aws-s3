# kaholo-plugin-Amazon-aws-s3
AWS-s3 plugin for Kaholo

This plugin is based on S3 AWS SDK [Documentaion](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)

##  Settings
1. Access Key ID (Vault) **Required if not in action** - The ID of the access key of the default IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in action** - The access key secret of the default IAM user to connect with.
3. Region (String) **Required if not in action** - The AWS region to make requests to on default.

## Method: Create Bucket
Create a new S3 bucket

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** - Create the new bucket in the specified region.
4. Name (String) **Required** - The name of the new bucket to create.

## Method: Upload File To Bucket
Upload a file to the specified bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** - Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to upload the object to.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. File Path (String) **Required** - The local path of the file on the agent running this action.
6. Dest Object Path (String) **Required** - The Path and name(key) of the new object created in the bucket for the file.

## Method: Delete Bucket
Delete the specified bucket

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to delete.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)

## Method: Delete Object
Delete the specified object in the specified bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. Object Path (String) **Required** - The path and name(key) of the object to delete.

## Method: List Bucket's Objects
List all objects matching the provided criteria in the specified bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. Prefix (String) **Optional** - Limits the response to keys that begin with the specified prefix.
6. Max Results (String) **Optional** - The maximum number of results to return. Default value is 1000.
7. Next Continuation Token (String) **Optional** - In case of pagination. If listed objects and more results left to return than 'NextContinuationToken' will be provided for you to continue listing from the point stopped.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html)

## Method: List Buckets
List all buckets owned by the signed user.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.

## Method: Manage Public Access Block
Manage the public access block of the specified bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. Block Public Acls (Boolean) **Optional** - Specifies whether AWS should block public access control lists (ACLs) for this bucket and objects in this bucket.
6. Block Public Policy (Boolean) **Optional** - Specifies whether AWS should block public bucket policies for this bucket.
7. Ignore Public Acls (Boolean) **Optional** - Specifies whether AWS should ignore public ACLs for this bucket and objects in this bucket.
8. Restrict Public Buckets (Boolean) **Optional** - Specifies whether AWS should restrict public bucket policies for this bucket. 

## Method: Manage Bucket ACL
Manage the permissions of the specified bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. Object Grant Type (Options) **Required if no ACL Grant Type** - The type of permission to give to the specified users and groups for access to the buckets objects. Possible values: **Read and Write | Read | Write | None**
6. ACL Grant Type (Options) **Required if no Object Grant Type** - The type of permission to give to the specified users and groups for accessing and editing permissions for this bucket. Possible values: **Read and Write | Read | Write | None**
7. Groups URIs (Options) **Required if no other grantees** - The uri of the predefined group(s) to allow access to the bucket. To specify multiple values provide an array of group URIs from code. Possible values: **Authenticated Users | All Users | Log Delivery Group**
8. Users Canonical IDs (Text) **Required if no other grantees** - 
9. Users Email Addresses (Text) **Required if no other grantees** - Grant the users with the provided email addresses access to the bucket. Only available in the regions: US East (N. Virginia) | US West (N. California) | US West (Oregon) | Asia Pacific (Singapore) | Asia Pacific (Sydney) | Asia Pacific (Tokyo) | Europe (Ireland) | South America (São Paulo)
10. Grant To Signed User (Boolean) **Required if no other grantees** - Grant the user making this request access to the bucket.
11. Don't Overwrite (Boolean) **Optional** - If true, add new permissions to existing permissions(In case they don't already exist). If false, overwrite existing permissions with new permissions provided in the request.

## Method: Apply Canned ACL to Bucket
Apply a predefined set of ACL permissions to the bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. Canned ACL Type (Options) **Required** - The type of predfined ACL permissions to apply to the bucket. Possible values: **Private | Public Read | Public Read Write | Authenticated Read**

## Method: Manage Bucket Versioning
Manage the versioning settings of the bucket

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. Status (Options) **Required** - whether to enable or disable versioning in the bucket. Possible values Enabled | Disabled.
5. MFA Delete (Options) **Optional** - whether to enable or disable MFA Delete feature in the bucket. Possible values Enabled | Disabled. Default value is disabled.
6. MFA (String) **Required if MFA Delete is enabled** - The concatenation of the authentication device's serial number, a space, and the value that is displayed on your authentication device.

## Method: Apply Bucket Policy
Apply the specified policy to the specified bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. Policy Object (JSON/Object) **Required** - The policy to apply to this bucket.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html) 

## Method: Get Bucket Policy
Get the current policy of the specified bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)

## Method: Delete Bucket Policy
Delete the current policy of the specified bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)

## Method: Manage Bucket Logging
Manage the logging settings of the specified bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Source Bucket (Autocomplete) **Required** - The bucket to enable or disable logging in.
5. Disable Logging (Boolean) **Optional** - If true disable logging, else enable it.
6. Target Bucket (Autocomplete) **Required** - In case of enabling logging, save all logs in the specified bucket.
7. Target Prefix (String) **Required** - assign the specified prefix to the names of all log files created. Should include the path the logs is saved in the target bucket.
8. Permission Type (Options) **Optional** - If specified, give access to the logging resources of the bucket to all users and groups specified. Possible values: **Read | Write | Full Control** 
9. Groups URIs (Options) **Optional** - The uri of the predefined group(s) to allow access to the bucket. To specify multiple values provide an array of group URIs from code. Possible values: **Authenticated Users | All Users | Log Delivery Group**
10. User Canonical IDs (Text) **Optional** - Give access to the logging resources of the bucket to all the users with the specified canonical IDs. You can enter multiple values by seperating each with a new line.
11. Email Addresses (Text) **Optional** - Give access to the logging resources of the bucket to all the users with the specified emails. You can enter multiple values by seperating each with a new line. **Only available in the regions**: US East (N. Virginia) | US West (N. California) | US West (Oregon) | Asia Pacific (Singapore) | Asia Pacific (Sydney) | Asia Pacific (Tokyo) | Europe (Ireland) | South America (São Paulo)
12. Grant To Signed User (Boolean) **Optional** - Grant the user making this request access to the bucket logging resources.
13. Don't Overwrite (Boolean) **Optional** - If true, only update values provided and not all of them. If false, overwite existing configuration with all field values.

## Method: Manage Bucket Encryption
Manage the encryption of the specified bucket.

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. Encryption Algorithm (Options) **Optional** - Whether to enable encryption, and if AWS should use S3 default key, or a specified KMS Key. Possible values: **SSE-S3 AES256 | SSE-KMS | none**
6. KMS Master Key (Autocomplete) **Required for SSE-KMS encryption** - For SSE-KMS encryption, the ID of the KMS key to provide for the bucket encryption.
7. Bucket Key Enabled (Boolean) **Optional** - Specifies whether AWS should use an S3 Bucket Key with server-side encryption using KMS (SSE-KMS) for new objects in the bucket. Existing objects are not affected. 

## Method: Enable Bucket Website Hosting
Enable Bucket Website Hosting

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. Error Document (String) **Optional** - The object key name to use when a 4XX class error occurs.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/CustomErrorDocSupport.html)
6. Index Document Suffix (String) **Optional** - A suffix that is appended to a request that is for a directory on the website endpoint. Can't use ecscape characters. For index.html suffix value, on a request to samplebucket/images/ the object with the key images/index.html will be returned.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/IndexDocumentSupport.html)
7. Routing Rules (String) **Optional** - Rules that define when a redirect is applied and the redirect behavior.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/how-to-page-redirect.html#advanced-conditional-redirects)

## Method: Enable Bucket Website Redirect
Enable Bucket Website Redirect

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to make the request on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
5. Redirect To Host (String) **Required** - The host name to redirect all requests to.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)
6. Redirect Algorithm (Options) **Required** - Possible values: **HTTP | HTTPS**

## Method: Get Bucket Website Hosting Configuration
Get Bucket Website Hosting Configuration

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to get it's static website hosting configuration.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)

## Method: Disable Bucket Website Hosting
Disable Bucket Website Hosting

## Parameters
1. Access Key ID (Vault) **Required if not in settings** - The ID of the access key of the IAM user to authenticate with.
2. Access Key Secret (Vault) **Required if not in setting** - The access key secret of the IAM user to authenticate with.
3. Region (Autocomplete) **Required if not in setting** -  Make this request in the specified region.
4. Bucket (Autocomplete) **Required** - The bucket to disable static website hosting on.
[Learn More](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)

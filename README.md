# Kaholo AWS S3 Plugin
This plugin extends Kaholo's capabilities to interact with Amazon Web Services [Simple Cloud Storage](https://aws.amazon.com/pm/serv-s3) (AWS S3). The plugin makes use of npm package [aws-sdk API](https://www.npmjs.com/package/aws-sdk) to provide methods work with buckets and object in S3.

## Prerequisites
To use this plugin you must have an account (either root or IAM) with Amazon Web Services (AWS) with sufficient permissions to work with EC2, and a pair of Access Keys associated with that account.

## Plugin Settings
To Access Plugin Settings, click on Settings | Plugins, find the "AWS S3" plugin, and then click on the plugin's name, which is blue hypertext. There is only one plugin-level setting for AWS S3, the default AWS region. If you specify a region here, e.g. `ap-southeast-1`, then newly created AWS S3 actions will inherit that region by default. This is provided only as a convenience, and each action's region can be modified after creation if the configured default is not appropriate.

## Plugin Account
This plugin makes use of a Kaholo Account to manage authentication. This allows the authentication to be configured once and then conveniently selected from a drop-down on an action-by-action basis. The security-sensitive AWS Access Keys are stored encrypted in the Kaholo vault to protect them from exposure in the UI, Activity Log, Final Result, and server logs. They may be stored in the vault before or during Kaholo Account creation.

The same Kaholo Account can be used for several AWS-related Kaholo plugins. If you've already configured one, for example to use with AWS CLI Plugin, then no further account configuration is necessary.

### Account Name
Account Name is an arbitrary name to identify a specific Kaholo account. It is suggested to name it after the AWS IAM user name associated with the access keys, and/or the type(s) of AWS access granted to that user. The names of the ID and Secret components in the Vault are ideally named similarly.

### Access Key ID (Vault)
This is the Access Key ID as provided by AWS or the AWS administrator. While the ID is not technically a secret it is vaulted anyway for better security. An Access Key ID looks something like this:

    AKIA3LQJ67DUTPFST5GM

### Access Key Secret (Vault)
This is the Access Key Secret as provided by AWS or the AWS administrator. This is a genuine secret and must be vaulted in the Kaholo Vault. An Access Key Secret looks something like this:

    DByOuQgqqwUWa8Y4Wu3hE3HTWZB6+mQVt8Qs0Phv

## Common Parameter: Region
Region is a required parameter in most methods of this plugin. It is the AWS geographical region (and datacenter) where buckets and object exist. This parameter has an autocomplete function so you may select the region using either the CLI-type ID string, for example `ap-southeast-1`, or the user-friendly location, e.g. "Asia Pacific (Singapore)". If using the code layer, use the CLI-type ID string.

## Common Parameter: Bucket
Bucket is a required parameter in most methods of this plugin. A bucket is a container for objects stored in Amazon S3. You can store any number of objects in a bucket and can have up to 100 buckets in your account.

Bucket names are restricted by [AWS bucket naming rules](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html). Specifically:
* Buckets names must be 3-63 characters long.
* Bucket names can consist only of lowercase letters, numbers, periods (`.`), and hyphens (`-`).
* Bucket names must begin and end with a an alphanumeric character.
* Bucket names must be unique across all AWS accounts in all the AWS Regions within a partition.
* Assorted other restricitons - see S3 documentation for further details.

## Method: Create Bucket
This method creates a new AWS S3 bucket.
### Parameter: Name
A unique name for the new bucket. This is name used as Parameter "Bucket" for all other methods.

## Method: Upload File To Bucket
Uploads the specified file from the Kaholo agent to an S3 bucket.
### Parameter: File Path
Absolute or relative path to the file on the Kaholo agent. A relative path is relative to the agent's default working directly
### Parameter: Dest Object Path
Actually the S3 name of the object, but if the name includes one or more `/`, the S3 Web Console will display the object as if it were in a hierarchical filesystem, i.e. on a path. This is so a large flat object store like an S3 bucket can be treated as, compared to and kept in sync with a hierarchical filesystem. Be careful to avoid object names ending in `/` or containing consecutive slashes (`//`) or there may be confusing results.

## Method: Delete Bucket
Deletes an S3 bucket. Normally a bucket must be empty to be deleted.
### Parameter: Delete Recursively
If the S3 bucket to be deleted is not empty, enable this parameter to delete all objects in the bucket before deleting the bucket itself.

## Method: Delete Object
Deletes one or more objects within an S3 bucket.
### Parameter: Object Path
The name of the S3 object (or root object) to delete. A root object is any for which other objects are named the same plus `/` plus anything more - for the purpose of deleting recursively.
### Parameter: Delete Recursively
If enabled, any object matching the specified object name plus `/` plus anything more will also be deleted.
### Parameter: Fail on object not found
If the specified object is not found, stop the Kaholo action with `error` status (and if configured the pipeline).

## Method: List Bucket's Objects
Lists the objects contained in a bucket
### Parameter: Prefix
To list only a subset of objects, provide an object name or path to match. Objects matching exactly or starting the same plus `/` plus anything more will be listed.

## Method: List Buckets
Lists all bucket in the specified region.

## Method: Manage Public Access Block
Manages public (unauthenticated) access to the S3 bucket.
### Parameter: Block Public ACLs
Blocks public access based on access control lists (ACLs).
* PUT Bucket acl and PUT Object acl calls fail if the specified access control list (ACL) is public.
* PUT Object calls fail if the request includes a public ACL.

However, existing policies and ACLs for buckets and objects are not modified. This setting enables you to protect against public access while allowing you to audit, refine, or otherwise alter the existing policies and ACLs for your buckets and objects.

### Parameter: Block Public Policy
Enabling this option causes Amazon S3 to reject calls to PUT Bucket policy if the specified bucket policy allows public access. It also causes Amazon S3 to reject calls to PUT access point policy for all of the bucket's same-account access points if the specified policy allows public access.

### Parameter: Ignore Public ACLs
Enabling this option causes Amazon S3 to ignore all public ACLs on a bucket and any objects that it contains. This setting enables you to safely block public access granted by ACLs while still allowing PUT Object calls that include a public ACL.

### Parameter: Restrict Public Buckets
Enabling this option restricts access to an access point or bucket with a public policy to only AWS service principals and authorized users within the bucket owner's account and access point owner's account. This setting blocks all cross-account access to the access point or bucket (except by AWS service principals), while still allowing users within the account to manage the access point or bucket.

## Method: Manage Bucket ACL
Amazon S3 access control lists (ACLs) enable you to manage access to buckets and objects. Each bucket and object has an ACL attached to it as a subresource. It defines which AWS accounts or groups are granted access and the type of access. When a request is received against a resource, Amazon S3 checks the corresponding ACL to verify that the requester has the necessary access permissions.

Which users are granted access may be specified any of a number of ways - group URI, canonical ID, email address, or all users who are signed, i.e. authenticated.
### Parameter: Object Grant Type
Use the choices parameter to select whether to grant read, write, both, or no access at all to objects in the bucket.
### Parameter: ACL Grant Type
Use the choices parameter to select whether to grant read, write, both, or no access at all to the ACL of the the bucket.
### Parameter: Groups URIs
Select a predefined group of users to be granted/denied access.
### Parameter: Users Canonical IDs
Specify specific canonical users to be granted/denied access. A canonical user ID is an alphanumeric identifier that obfuscates the AWS account ID for the purpose of granting cross-account access to buckets.
### Parameter: Users Email Addresses
Specify the email address of an AWS account to be granted/denied access.
### Parameter: Grant To Signed User
Grant the access to ANY authenticated user.
### Parameter: Don't Overwrite
If enabled, the granted permissions are added to existing permissions. If NOT enabled, the existing bucket ACL is instead replaced.

## Method: Apply Canned ACL to Bucket
Apply an AWS pre-packaged (canned) ACL to the bucket. This is a convenient way to quickly arrive at a recommended ACL configuration.
### Parameter: Canned ACL Type
Choose among the listed ACLs - private, public read (only), public read/write, or read (only) for authenticated users.

## Method: Manage Bucket Versioning
Manages the configuration of bucket versioning, including an option to require multi-factor authentication (MFA) for delete operations.
### Parameter: Status
Enable or disable bucket versioning
### Parameter: MFA Delete
If enabled, the bucket owner must include two forms of authentication in any request to delete a version or change the versioning state of the bucket.
### Parameter: MFA
The concatenation of the authentication device's serial number, a space, and the value that is displayed on the authentication device.

## Method: Apply Bucket Policy
Apply a specific policy to a bucket. Policies are written as JSON documents.
### Parameter: Policy Object
The code-layer object or JSON document containing the policy to apply to the bucket.

## Method: Get Bucket Policy
Retreive the current policy applied to a bucket.

## Method: Delete Bucket Policy
Delete the current policy applied to a bucket.

## Method: Manage Bucket Logging
You can record the actions that are taken by users, roles, or AWS services on Amazon S3 resources and maintain log records for auditing and compliance purposes. To do this, you can use server-access logging, AWS CloudTrail logging, or a combination of both.

This method manages the configuration of server-access logging only. Which users are granted access to the logs in the target bucket may be specified any of a number of ways - group URI, canonical ID, email address, or all users who are signed, i.e. authenticated.

### Parameter: Source Bucket
The bucket for which logging is to be enabled or disabled.
### Parameter: Disable Logging
Enable or disable logging for the bucket.
### Parameter: Target Bucket
The bucket that is to recieve the logging information.
### Parameter: Target Prefix
A prefix for the object name fo the logged information.
### Parameter: Permission Type
The permission to grant over the logged information, i.e. the logs in the target bucket.
### Parameter: Groups URIs
Select a predefined group of users to be granted/denied access.
### Parameter: Users Canonical IDs
Specify specific canonical users to be granted/denied access. A canonical user ID is an alphanumeric identifier that obfuscates the AWS account ID for the purpose of granting cross-account access to buckets.
### Parameter: Users Email Addresses
Specify the email address of an AWS account to be granted/denied access.
### Parameter: Grant To Signed User
Grant the access to ANY authenticated user.
### Parameter: Don't Overwrite
If enabled, the specified permissions are added to existing ones for the target bucket. If not the ACL is replaced.

## Method: Manage Bucket Encryption
Amazon S3 buckets have bucket encryption enabled by default, and new objects are automatically encrypted by using server-side encryption with Amazon S3 managed keys (SSE-S3). This encryption applies to all new objects in Amazon S3 buckets, at no cost.

For more control over encryption keys, this method instead manually manages bucket encryption.
### Parameter: Encryption Algorithm
Which algorythm to use for bucket encryption, or `none` to disable bucket encryption.
### Parameter: KMS Master Key
The ARN of the KMS master key for the bucket's encryption.
### Parameter: Bucket Key Enabled
Select this to enable use of an S3 Bucket Key for SSE-KMS on new objects, to reduce requests to (and costs associated with) AWS KMS.

## Method: Enable Bucket Website Hosting
Enable an S3 bucket to be used as a static website.
### Parameter: Error Document
The document to show when an error occurs.
### Parameter: Index Document Suffix
The document to be used as the home or default page of the website, typically `index.html`.
### Parameter: Routing Rules
A JSON document specifiying the redirection rules to automatically redirect webpage requests for specific content.

## Method: Enable Bucket Website Redirect
Enable a redirect for requests for a specific object in the bucket.
### Parameter: Redirect To Host
The host to which to redirect the request.
### Parameter: Redirect Algorithm
The protocol to use for the redirect - HTTP, HTTPS, or none.

## Method: Get Bucket Website Hosting Configuration
Retreives the current website hosting configuration of the bucket.

## Method: Disable Bucket Website Hosting
Disables website hosting for the bucket.

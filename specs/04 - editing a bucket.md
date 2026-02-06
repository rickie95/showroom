# Editing a bucket

This page is dedicated the management of a single bucket. It requires the bucked id from the previous page.

On the top right there's a red DELETE button. The button works the same as described in the "Delete a bucket section" in [02 - buckets.md](./02%20-%20buckets.md).

The page reports:
1. the bucket id, on top left
2. some stats, like
    a. number of objects
    b. data occupied, formatted accordingly to the scale (KB, MB, GB, TB, PB)
    c. info about quotas: maxSize and maxObjects
3. a table listing the keys associated with the bucket, for each row show:
    a. the key name
    b. accessKeyId, with a button to copy the id
    c. permissions: read, write, owner. Use checkboxes to signal if a permission is set or not

## 1. fetching bucket info
Bucket info can be retrieved with a GET call to `BASE_URL/v1/bucket?id=BUCKET_ID`

the response looks like this
```json
{
  "id": "afa8f0a22b40b1247ccd0affb869b0af5cff980924a20e4b5e0720a44deb8d39",
  "globalAliases": [
    "my_documents"
  ],
  "websiteAccess": true,
  "websiteConfig": {
    "indexDocument": "index.html",
    "errorDocument": "error/400.html"
  },
  "keys": [
    {
      "accessKeyId": "string",
      "name": "string",
      "permissions": {
        "read": true,
        "write": true,
        "owner": true
      },
      "bucketLocalAliases": [
        "my_documents"
      ]
    }
  ],
  "objects": 14827,
  "bytes": 13189855625,
  "unfinishedUploads": 0,
  "quotas": {
    "maxSize": null,
    "maxObjects": null
  }
}
```

## 2. Add a key to the bucket
The user can add an existing key to the bucket with the ADD KEY button. When the user clicks, a modal appears:

1. a select allows the user to choose a key by key name
2. three checkboxes allows the permission setting (read, write, ownership)

if the user click ADD, a POST call to `BASE_URL/v1/bucket/allow` is done, with the following data:
```json
{
  "bucketId": "f36f924c631fab6b5c236e0e709dcba01a4447fac1b3a92342b7057f116fb801",
  "accessKeyId": "GKd570dd096bc04e38607e6661",
  "permissions": {
    "read": true,
    "write": true,
    "owner": false
  }
}
```
while the call is made, a spinning wheel is shown, waiting for the response status code.

this call can returns:
- 200, meaning ok. the operation is concluded and the modal is closed
- 400, bad request. The user must check the input data
- 404, bucket not found
- 500, error with the server

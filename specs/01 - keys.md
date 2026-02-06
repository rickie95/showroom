# Keys

This page allow the user to manage the available keys in the system.

Layout: 
- a table with id and name (name can be optional/null), for each row there should be a DELETE action button and a EDIT action button.
- on top right, a "New Key" button and an "Import Key" button

## 1. Key table
the key table fetches keys from `BASE_URL/key?list`, which return a response like this:
```json
[
  {
    "id": "GK31c2f218a2e44f485b94239e",
    "name": "test-key"
  },
  {
    "id": "GKe10061ac9c2921f09e4c5540",
    "name": ""
  }
]
```


## 2. Adding a new key
When the user clicks the button, a modal appears requiring the user to input:
1. name of the key, optional
2. a checkbox to tick if that key can create new buckets

Once the user clicks on Create, a POST request to `BASE_URL/key` is made, with the following payload:

in this case the key is not authorized to create buckets.
```json
{
  "name": "test-key",
  "allow": null,
  "deny": {
    "createBucket": true
  }
}
```

the api responds with 

```json
{
  "name": "test-key",
  "accessKeyId": "GK31c2f218a2e44f485b94239e",
  "secretAccessKey": "b892c0665f0ada8a4755dae98baa3b133590e11dae3bcc1f9d769d67f16c3835",
  "permissions": {
    "createBucket": false
  },
  "buckets": [
    {
      "id": "70dc3bed7fe83a75e46b66e7ddef7d56e65f3c02f9f80b6749fb97eccb5e1033",
      "globalAliases": [
        "my-bucket"
      ],
      "localAliases": [
        "GK31c2f218a2e44f485b94239e:localname"
      ],
      "permissions": {
        "read": true,
        "write": true,
        "owner": false
      }
    }
  ]
}
```

## 3. Delete a key
When the user clicks on the button, a modal appears to ask confirmation from the user.
The modal reports the key ID and its name, and will need the user to enter the ID in order to proceed for deletion.

The delete operation is implemented with a DELETE call to `BASE_URL/v1/key?id=KEY_ID`. A 200 response code means OK.

## 4. Edit a key
Whe the user clicks on the button a modal appears, showing key id and name.

A checkbox if filled with the key capabilities (can or cannot create buckets), the user can change the state of the checkbox.

If the user presses save, a POST call to `BASE_URL/v1/key?id=KEY_ID` is made, the following data, accordingly to their decision
```json
{
  "name": "test-key",
  "allow": null,
  "deny": {
    "createBucket": true
  }
}
```
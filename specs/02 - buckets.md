# Buckets

This page allow the user to manage the available buckets in the system.

Layout: 
- a table with id and name (name can be optional/null), for each row there should be a DELETE action button and a EDIT action button.
- on top right, a "New Bucket" button.

## 1. Bucket table
The table fetches data with a GET to `BASE_URL/v1/bucket?list` and answers with
```json
[
  {
    "id": "70dc3bed7fe83a75e46b66e7ddef7d56e65f3c02f9f80b6749fb97eccb5e1033",
    "globalAliases": [
      "container_registry"
    ]
  },
  {
    "id": "96470e0df00ec28807138daf01915cfda2bee8eccc91dea9558c0b4855b5bf95",
    "localAliases": [
      {
        "alias": "my_documents",
        "accessKeyid": "GK31c2f218a2e44f485b94239e"
      }
    ]
  },
  {
    "id": "d7452a935e663fc1914f3a5515163a6d3724010ce8dfd9e4743ca8be5974f995",
    "globalAliases": [
      "example.com",
      "www.example.com"
    ],
    "localAliases": [
      {
        "alias": "corp_website",
        "accessKeyId": "GKe10061ac9c2921f09e4c5540"
      },
      {
        "alias": "web",
        "accessKeyid": "GK31c2f218a2e44f485b94239e"
      }
    ]
  }
]
```

the table should report:
- the global aliases
- a LOCAL ALIASES to show a modal, which reports a second table with alias + access key id.
    - access key id cell has a "copy to clipboard" button


## 2. Delete a bucket
Clicking on the delete action should open a modal asking for confirmation. The user can unlock the CONFIRM DELETE action entering the bucket id. The modal shows both id and global alias

## 3. Edit a bucket
This navigates into a dedicated page, see [Editing a bucket](./04%20-%20editing%20a%20bucket.md). The navigation must send the bucket id, which will be used by the details page.
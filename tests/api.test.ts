import { expect, MockedFunction, test, vi } from "vitest";
import { GarageApiV1Client } from "../src/api";
import axios from "axios";

// Source - https://stackoverflow.com/a/76088688
// Posted by IowA
// Retrieved 2026-02-08, License - CC BY-SA 4.0

vi.mock("axios", () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      create: vi.fn().mockReturnThis(),
      interceptors: {
        request: {
          use: vi.fn(),
          eject: vi.fn(),
        },
        response: {
          use: vi.fn(),
          eject: vi.fn(),
        },
      },
    },
  };
});

test("can create a GarageApiV1Client instance", () => {
  const client = new GarageApiV1Client();
  expect(client).toBeInstanceOf(GarageApiV1Client);
});

test("getHealth returns expected structure", async () => {
  (axios.get as MockedFunction<typeof axios.get>).mockResolvedValue({
    status: 200,
    data: {
      status: "healthy",
      knownNodes: 5,
      connectedNodes: 4,
      storageNodes: 3,
      storageNodesOk: 3,
    },
  });

  const client = new GarageApiV1Client();

  const health = await client.getHealth();
  expect(health).toHaveProperty("status");
  expect(health).toHaveProperty("knownNodes");
  expect(health).toHaveProperty("connectedNodes");
  expect(health).toHaveProperty("storageNodes");
  expect(health).toHaveProperty("storageNodesOk");

  expect(typeof health.status).toBe("string");
  expect(typeof health.knownNodes).toBe("number");
  expect(typeof health.connectedNodes).toBe("number");
  expect(typeof health.storageNodes).toBe("number");
  expect(typeof health.storageNodesOk).toBe("number");

  expect(health.status).toBe("healthy");
  expect(health.knownNodes).toBe(5);
  expect(health.connectedNodes).toBe(4);
  expect(health.storageNodes).toBe(3);
  expect(health.storageNodesOk).toBe(3);
});

test("getHealth returns error when status is not 200", async () => {
  (axios.get as MockedFunction<typeof axios.get>).mockResolvedValue({
    status: 500,
  });

  const client = new GarageApiV1Client();

  await expect(client.getHealth()).rejects.toThrowError();
});

test("getBuckets returns an array", async () => {
  (axios.get as MockedFunction<typeof axios.get>).mockResolvedValue({
    status: 200,
    data: [
      {
        id: "abcd",
        globalAliases: ["mlflow"],
        localAliases: [],
      },
      {
        id: "efgh",
        globalAliases: ["dvc-test"],
        localAliases: [
          {
            accessKeyId: "GKb3972292f02f77acd66939b8",
            alias: "janux-saipem-cvat",
          },
        ],
      },
    ],
  });

  const client = new GarageApiV1Client();
  const buckets = await client.getBuckets();
  expect(buckets.length).toBe(2);
  expect(buckets.every((bucket) => bucket.id)).toBe(true);
  expect(buckets.every((bucket) => bucket.globalAliases)).toBe(true);
  expect(buckets.every((bucket) => bucket.localAliases)).toBe(true);

  expect(buckets[0].id).toBe("abcd");
  expect(buckets[0].globalAliases).toEqual(["mlflow"]);
  expect(buckets[0].localAliases).toEqual([]);

  expect(buckets[1].id).toBe("efgh");
  expect(buckets[1].globalAliases).toEqual(["dvc-test"]);
  expect(buckets[1].localAliases).toEqual([
    {
      accessKeyId: "GKb3972292f02f77acd66939b8",
      alias: "janux-saipem-cvat",
    },
  ]);
});

test("getBuckets returns empty array when no buckets are found", async () => {
  (axios.get as MockedFunction<typeof axios.get>).mockResolvedValue({
    status: 200,
    data: [],
  });

  const client = new GarageApiV1Client();
  const buckets = await client.getBuckets();
  expect(Array.isArray(buckets)).toBe(true);
  expect(buckets.length).toBe(0);
});

test("getBuckets returns error when status is not 200", async () => {
  (axios.get as MockedFunction<typeof axios.get>).mockResolvedValue({
    status: 404,
  });

  const client = new GarageApiV1Client();

  await expect(client.getBuckets()).rejects.toThrowError();
});

test("getBucketDetails returns expected structure", async () => {
  (axios.get as MockedFunction<typeof axios.get>).mockResolvedValue({
    status: 200,
    data: {
      id: "abcd",
      globalAliases: ["mlflow"],
      websiteAccess: false,
      keys: [
        {
          id: "key1",
          name: "Key 1",
          permissions: {
            read: true,
            write: false,
            owner: false,
          },
          bucketLocalAliases: ["alias1", "alias2"],
        }
      ],
      objects: 10,
      bytes: 1024,
      quotas: {
        maxSize: 1048576,
        maxObjects: 100,
      },
    },
  });
  const client = new GarageApiV1Client();
  const bucketDetails = await client.getBucketDetails("dummy-id");
  expect(bucketDetails).toHaveProperty("id");
  expect(bucketDetails).toHaveProperty("globalAliases");
  expect(bucketDetails).toHaveProperty("websiteAccess");
  expect(bucketDetails).toHaveProperty("keys");
  expect(bucketDetails).toHaveProperty("objects");
  expect(bucketDetails).toHaveProperty("bytes");
  expect(bucketDetails).toHaveProperty("quotas");
});


test("getBucketDetails returns error when status is 404", async () => {
  (axios.get as MockedFunction<typeof axios.get>).mockResolvedValue({
    status: 404,
    data: [],
  });

  const client = new GarageApiV1Client();
  await expect(client.getBucketDetails("dummy-id")).rejects.toThrowError();
});
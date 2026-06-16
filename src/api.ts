import axios from "axios";
import { getApiConfig } from "./apiConfig";
import type { HealthInfo, BucketDetails } from "./model";
import type { BucketListItem, KeyCreateResponse, KeyDetails, KeyListItem } from "./types";

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export class AppError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

function getRequestConfig() {
  const config = getApiConfig();

  if (!config.baseUrl || !config.authToken) {
    throw new AppError(
      "Save a base URL and auth token before making requests.",
    );
  }

  return config;
}

function authHeaders(authToken: string) {
  return {
    Authorization: `Bearer ${authToken}`,
  };
}

type BucketApiResponse = {
  id: string;
  globalAliases?: string[];
  localAliases?: BucketListItem["localAliases"];
};

type KeyApiResponse = {
  id: string;
  name?: string | null;
};

interface GarageApiClient {
  getHealth(): Promise<HealthInfo>;
  getBuckets(): Promise<BucketListItem[]>;
  getBucketDetails(bucketId: string): Promise<BucketDetails>;
  createBucket?(bucketId: string): Promise<BucketDetails>;
  addKeyToBucket?(
    bucketId: string,
    keyId: string,
    read: boolean,
    write: boolean,
    owner: boolean,
  ): Promise<BucketDetails>;
  getKeys(): Promise<KeyListItem[]>;
  getKeyDetails(keyId: string): Promise<KeyDetails>;
  createKey(createBucket: boolean, name?: string | null): Promise<KeyCreateResponse>;
  updateKeyPermissions(
    keyId: string,
    canCreateBucket: boolean,
  ): Promise<KeyDetails>;
  deleteKey?(keyId: string): Promise<void>;
  deleteBucket?(bucketId: string): Promise<void>;
}

export class GarageApiV1Client implements GarageApiClient {
  public async deleteBucket(bucketId: string): Promise<void> {
    const { baseUrl, authToken } = getRequestConfig();
    const response = await axios.delete(`${baseUrl}/v1/bucket?id=${bucketId}`, {
      headers: authHeaders(authToken),
    });
    if (response.status !== 204) {
      const message = response.data?.message || `Request failed with ${response.status}`;
      throw new AppError(message, response.status);
    }
  }
  public async getHealth(): Promise<HealthInfo> {
    try {
      const { baseUrl, authToken } = getRequestConfig();
      const response = await axios.get(`${baseUrl}/v1/health`, {
        headers: authHeaders(authToken),
      });

      if (response.status !== 200) {
        throw new Error(`Request to /v1/health returned a ${response.status}`);
      }

      return {
        status: response.data.status,
        knownNodes: response.data.knownNodes,
        connectedNodes: response.data.connectedNodes,
        storageNodes: response.data.storageNodes,
        storageNodesOk: response.data.storageNodesOk,
      } as HealthInfo;
    } catch (error) {
      console.log(`Error while trying to get health status: ${error}`);
      throw new AppError("Cannot connect to the Garage instance.");
    }
  }

  public async getBuckets(): Promise<BucketListItem[]> {
    const { baseUrl, authToken } = getRequestConfig();
    const response = await axios.get(`${baseUrl}/v1/bucket?list`, {
      headers: authHeaders(authToken),
    });

    if (response.status !== 200) {
      const message =
        response.data?.message || `Cannot fetch buckets. Request failed with ${response.status}`;
      throw new AppError(message);
    }

    return response.data.map((bucket: BucketApiResponse) => ({
      id: bucket.id,
      globalAliases: bucket.globalAliases,
      localAliases: bucket.localAliases,
    })) as BucketListItem[];
  }

  public async getBucketDetails(bucketId: string): Promise<BucketDetails> {
    const { baseUrl, authToken } = getRequestConfig();
    const response = await axios.get(`${baseUrl}/v1/bucket?id=${bucketId}`, {
      headers: authHeaders(authToken),
    });

    if (response.status === 404) {
      throw new NotFoundError(`Bucket with id ${bucketId} not found`);
    }

    if (response.status !== 200) {
      const message =
        response.data?.message || `Request failed with ${response.status}`;
      throw new AppError(message, response.status);
    }

    return {
      id: response.data.id,
      globalAliases: response.data.globalAliases,
      localAliases: response.data.localAliases,
      websiteAccess: response.data.websiteAccess,
      keys: response.data.keys,
      objects: response.data.objects,
      bytes: response.data.bytes,
      quotas: response.data.quotas,
    } as BucketDetails;
  }

  public async createBucket(bucketId: string): Promise<BucketDetails> {
    const { baseUrl, authToken } = getRequestConfig();
    const response = await axios.post(
      `${baseUrl}/v1/bucket`,
      { globalAlias: bucketId },
      {
        headers: {
          ...authHeaders(authToken),
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status !== 200) {
      const message =
        response.data?.message || `Request failed with ${response.status}`;
      throw new AppError(message, response.status);
    }

    return {
      id: response.data.id,
      globalAliases: response.data.globalAliases,
      localAliases: response.data.localAliases,
      websiteAccess: response.data.websiteAccess,
      keys: response.data.keys,
      objects: response.data.objects,
      bytes: response.data.bytes,
      quotas: response.data.quotas,
    } as BucketDetails;
  }

  public async addKeyToBucket(
    bucketId: string,
    keyId: string,
    read: boolean,
    write: boolean,
    owner: boolean,
  ): Promise<BucketDetails> {
    const { baseUrl, authToken } = getRequestConfig();
    const response = await axios.post(
      `${baseUrl}/v1/bucket/allow`,
      {
        bucketId: bucketId,
        accessKeyId: keyId,
        permissions: {
          read: read,
          write: write,
          owner: owner,
        },
      },
      {
        headers: {
          ...authHeaders(authToken),
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      const message =
        response.data?.message || `Request failed with ${response.status}`;
      throw new AppError(message, response.status);
    }

    return {
      id: response.data.id,
      globalAliases: response.data.globalAliases,
      localAliases: response.data.localAliases,
      websiteAccess: response.data.websiteAccess,
      keys: response.data.keys,
      objects: response.data.objects,
      bytes: response.data.bytes,
      quotas: response.data.quotas,
    } as BucketDetails;
  }

  public async getKeys(): Promise<KeyListItem[]> {
    const { baseUrl, authToken } = getRequestConfig();
    const response = await axios.get(`${baseUrl}/v1/key?list`, {
      headers: authHeaders(authToken),
    }).catch((error) => {
      console.log(`Failed to fetch keys: ${error}`);
      throw new AppError("Cannot fetch keys from the Garage instance.");
    });

    if (response.status !== 200) {
      const message =
        response.data?.message || `Request failed with ${response.status}`;
        console.log(`Failed to fetch keys: ${message}`);
      throw new AppError(message, response.status);
    }

    return response.data.map((key: KeyApiResponse) => ({
      id: key.id,
      name: key.name,
    })) as KeyListItem[];
  }

  public async getKeyDetails(keyId: string): Promise<KeyDetails> {
    const { baseUrl, authToken } = getRequestConfig();
    const response = await axios.get(`${baseUrl}/v1/key?id=${keyId}`, {
      headers: authHeaders(authToken),
    });

    if (response.status === 404) {
      throw new NotFoundError(`Key with id ${keyId} not found`);
    }

    if (response.status !== 200) {
      const message =
        response.data?.message || `Request failed with ${response.status}`;
      throw new AppError(message, response.status);
    }

    return {
      id: response.data.id,
      name: response.data.name,
      permissions: response.data.permissions,
      buckets: response.data.buckets,
    } as KeyDetails;
  }

  public async createKey(canCreate: boolean, name?: string | null): Promise<KeyCreateResponse> {
    const { baseUrl, authToken } = getRequestConfig();
    const response = await axios.post(
      `${baseUrl}/v1/key`,
      {
        name: name,
      },
      {
        headers: {
          ...authHeaders(authToken),
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status !== 200) {
      const message =
        response.data?.message || `Request failed with ${response.status}`;
      throw new AppError(message, response.status);
    }

    if (canCreate) {
      await this.updateKeyPermissions(response.data.accessKeyId, true).catch((error) => {
        this.deleteKey(response.data.accessKeyId);
        console.log(`Failed to set permissions for key ${response.data.accessKeyId}: ${error}`);
        throw new AppError("Key created but failed to set permissions. The key has been deleted, please try again.");
      });
    }

    return {
      name: response.data.name,
      accessKeyId: response.data.accessKeyId,
      secretAccessKey: response.data.secretAccessKey,
      permissions: response.data.permissions,
      buckets: response.data.buckets,
    } as KeyCreateResponse;
  }

  public async importKey(keyId: string, secretAccessKey: string, name? : string | null, canCreate: boolean = false): Promise<KeyDetails> {
    const { baseUrl, authToken } = getRequestConfig();
    const response = await axios.post(
      `${baseUrl}/v1/key/import`,
      {
        name: name,
        accessKeyId: keyId,
        secretAccessKey: secretAccessKey,
      },
      {
        headers: {
          ...authHeaders(authToken),
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status !== 200) {
      const message =
        response.data?.message || `Request failed with ${response.status}`;
      throw new AppError(message, response.status);
    }

    if (canCreate) {
      await this.updateKeyPermissions(keyId, true).catch((error) => {
        this.deleteKey(keyId);
        console.log(`Failed to set permissions for imported key ${keyId}: ${error}`);
        throw new AppError("Key imported but failed to set permissions. The key has been deleted, please try again.");
      });
    }

    return {
      id: keyId,
      name: name || "Imported Key",
      permissions: {
        createBucket: canCreate,
        read: false,
        write: false,
        owner: false,
      },
      buckets: [],
    } as KeyDetails;
  }

  public async updateKeyPermissions(
    keyId: string,
    canCreateBucket: boolean,
  ): Promise<KeyDetails> {
    const { baseUrl, authToken } = getRequestConfig();
    const requestBody = {
      allow: canCreateBucket ? { createBucket: true } : null,
      deny: canCreateBucket ? null : { createBucket: true },
    };

    const response = await axios.post(
      `${baseUrl}/v1/key?id=${keyId}`,
      requestBody,
      {
        headers: {
          ...authHeaders(authToken),
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status !== 200) {
      const message =
        response.data?.message || `Request failed with ${response.status}`;
      throw new AppError(message, response.status);
    }

    return {
      id: response.data.accessKeyId,
      name: response.data.name,
      permissions: response.data.permissions,
      buckets: response.data.buckets,
    } as KeyDetails;
  }

  public async deleteKey(keyId: string): Promise<void> {
    const { baseUrl, authToken } = getRequestConfig();
    const response = await axios.delete(`${baseUrl}/v1/key?id=${keyId}`, {
      headers: authHeaders(authToken),
    });

    if (response.status !== 204) {
      const message =
        response.data?.message || `Request failed with ${response.status}`;
      console.log(`Failed to delete key ${keyId}: ${message}`);
      throw new AppError(message, response.status);
    }
  }
}

function buildUrl(path: string, baseUrl: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const { baseUrl, authToken } = getRequestConfig();
  const headers: Record<string, string> = {
    ...authHeaders(authToken),
    ...options.headers,
  };

  const response = await fetch(buildUrl(path, baseUrl), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    const error = new Error(
      message || `Request failed with ${response.status}`,
    );
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

async function requestNoJson(path: string, options: RequestOptions = {}) {
  const { baseUrl, authToken } = getRequestConfig();
  const headers: Record<string, string> = {
    ...authHeaders(authToken),
    ...options.headers,
  };

  const response = await fetch(buildUrl(path, baseUrl), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    const error = new Error(
      message || `Request failed with ${response.status}`,
    );
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response;
}

function jsonBody(data: unknown) {
  return {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}

export { requestJson, requestNoJson, jsonBody };

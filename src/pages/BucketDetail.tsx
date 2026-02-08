import { useEffect, useMemo, useState } from "react";
import { GarageApiV1Client, requestJson, requestNoJson } from "../api";
import CopyButton from "../components/CopyButton";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import type { BucketDetails, KeyListItem } from "../types";
import { ensureArray, formatBytes, formatCount } from "../utils";

function AddKeyModal({
  bucketId,
  onClose,
  onAdded,
}: Readonly<{
  bucketId: string;
  onClose: () => void;
  onAdded: () => void;
}>) {
  const apiClient = new GarageApiV1Client();
  const [keys, setKeys] = useState<KeyListItem[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [permissions, setPermissions] = useState({
    read: true,
    write: false,
    owner: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadKeys = async () => {
      try {
        const data = await apiClient.getKeys();
        if (!active) return;
        setKeys(data);
        setSelectedKey(data[0]?.id || "");
      } catch (error) {
        if (!active) return;
        setError(
          error instanceof Error ? error.message : "Unable to load keys",
        );
      }
    };
    loadKeys();
    return () => {
      active = false;
    };
  }, []);

  const handleAdd = async () => {
    if (!selectedKey) return;
    setLoading(true);
    setError("");
    try {
      await apiClient.addKeyToBucket(
        bucketId,
        selectedKey,
        permissions.read,
        permissions.write,
        permissions.owner,
      );
      onAdded();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to add key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add key to bucket"
      onClose={onClose}
      actions={
        <button
          className="primary-button"
          type="button"
          onClick={handleAdd}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add"}
        </button>
      }
    >
      <div className="stack">
        <label>
          <span>Select key</span>
          <select
            value={selectedKey}
            onChange={(event) => setSelectedKey(event.target.value)}
          >
            {keys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.name || key.id}
              </option>
            ))}
          </select>
        </label>
        <div className="permissions">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={permissions.read}
              onChange={(event) =>
                setPermissions((prev) => ({
                  ...prev,
                  read: event.target.checked,
                }))
              }
            />
            <span>Read</span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={permissions.write}
              onChange={(event) =>
                setPermissions((prev) => ({
                  ...prev,
                  write: event.target.checked,
                }))
              }
            />
            <span>Write</span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={permissions.owner}
              onChange={(event) =>
                setPermissions((prev) => ({
                  ...prev,
                  owner: event.target.checked,
                }))
              }
            />
            <span>Owner</span>
          </label>
        </div>
        {loading ? <Spinner /> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  );
}

export default function BucketDetail({
  bucketId,
}: Readonly<{ bucketId: string }>) {
  const [details, setDetails] = useState<BucketDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [addKeyOpen, setAddKeyOpen] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await requestJson<BucketDetails>(
        `/v1/bucket?id=${encodeURIComponent(bucketId)}`,
      );
      setDetails(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load bucket details",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [bucketId]);

  const handleDelete = async () => {
    try {
      await requestNoJson(`/v1/bucket?id=${encodeURIComponent(bucketId)}`, {
        method: "DELETE",
      });
      globalThis.location.hash = "#buckets";
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to delete bucket",
      );
    }
  };

  const stats = useMemo(() => {
    return {
      objects: formatCount(details?.objects ?? null),
      bytes: formatBytes(details?.bytes ?? null),
      maxSize:
        details?.quotas?.maxSize === null ||
        details?.quotas?.maxSize === undefined
          ? "Unlimited"
          : formatBytes(details?.quotas?.maxSize),
      maxObjects:
        details?.quotas?.maxObjects === null ||
        details?.quotas?.maxObjects === undefined
          ? "Unlimited"
          : formatCount(details?.quotas?.maxObjects),
    };
  }, [details]);

  return (
    <div className="stack">
      <div className="page-actions">
        <div>
          <p className="eyebrow">Bucket ID</p>
          <p className="mono">{bucketId}</p>
        </div>
        <button
          className="primary-button danger"
          type="button"
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </button>
      </div>
      {loading ? <Spinner /> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {details ? (
        <>
          <div className="grid four">
            <div className="metric">
              <p className="eyebrow">Objects</p>
              <h4>{stats.objects}</h4>
            </div>
            <div className="metric">
              <p className="eyebrow">Data stored</p>
              <h4>{stats.bytes}</h4>
            </div>
            <div className="metric">
              <p className="eyebrow">Quota max size</p>
              <h4>{stats.maxSize}</h4>
            </div>
            <div className="metric">
              <p className="eyebrow">Quota max objects</p>
              <h4>{stats.maxObjects}</h4>
            </div>
          </div>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Keys with access</h3>
                <p className="muted">Manage permissions for this bucket.</p>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => setAddKeyOpen(true)}
              >
                Add Key
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Access key</th>
                    <th>Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {ensureArray(details.keys).map((key) => (
                    <tr key={key.accessKeyId}>
                      <td>{key.name || "Unnamed"}</td>
                      <td className="mono">
                        {key.accessKeyId}
                        <CopyButton
                          className="ghost-button"
                          value={key.accessKeyId}
                        />
                      </td>
                      <td className="permissions">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={key.permissions.read}
                            readOnly
                          />
                          <span>Read</span>
                        </label>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={key.permissions.write}
                            readOnly
                          />
                          <span>Write</span>
                        </label>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={key.permissions.owner}
                            readOnly
                          />
                          <span>Owner</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {addKeyOpen ? (
        <AddKeyModal
          bucketId={bucketId}
          onClose={() => setAddKeyOpen(false)}
          onAdded={() => {
            setAddKeyOpen(false);
            loadDetails();
          }}
        />
      ) : null}

      {deleteOpen ? (
        <Modal
          title="Delete bucket"
          onClose={() => {
            setDeleteOpen(false);
            setDeleteInput("");
          }}
          actions={
            <button
              className="primary-button danger"
              type="button"
              disabled={deleteInput !== bucketId}
              onClick={handleDelete}
            >
              Confirm delete
            </button>
          }
        >
          <p>Type the bucket ID to unlock deletion.</p>
          <div className="stack">
            <div>
              <p className="eyebrow">Bucket ID</p>
              <p className="mono">{bucketId}</p>
            </div>
            <div>
              <p className="eyebrow">Global aliases</p>
              <p>{ensureArray(details?.globalAliases).join(", ") || "None"}</p>
            </div>
            <input
              type="text"
              value={deleteInput}
              onChange={(event) => setDeleteInput(event.target.value)}
              placeholder="Enter bucket id"
            />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

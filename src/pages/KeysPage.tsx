import { useEffect, useState } from "react";
import { GarageApiV1Client } from "../api";
import CopyButton from "../components/CopyButton";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import type { KeyCreateResponse, KeyListItem } from "../types";

function KeyCreateModal({
  onClose,
  onCreated,
}: Readonly<{ onClose: () => void; onCreated: () => void }>) {
  const apiClient = new GarageApiV1Client();
  const [name, setName] = useState("");
  const [allowCreate, setAllowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<KeyCreateResponse | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const payload = {
      name: name || null,
      allow: allowCreate ? { createBucket: true } : null,
      deny: allowCreate ? null : { createBucket: true },
    };
    await apiClient
      .createKey(payload.name)
      .then((response) => setCreated(response))
      .catch((error) =>
        setError(
          error instanceof Error ? error.message : "Unable to create key",
        ),
      )
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Modal
      title="Create new key"
      onClose={onClose}
      actions={
        created ? (
          <button className="primary-button" type="button" onClick={onCreated}>
            Done
          </button>
        ) : (
          <button
            className="primary-button"
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        )
      }
    >
      {created ? (
        <div className="stack">
          <div>
            <p className="eyebrow">Access key ID</p>
            <p className="mono">{created.accessKeyId}</p>
            <CopyButton className="ghost-button" value={created.accessKeyId} />
          </div>
          <div>
            <p className="eyebrow">Secret access key</p>
            <p className="mono">{created.secretAccessKey}</p>
            <CopyButton
              className="ghost-button"
              value={created.secretAccessKey}
            />
          </div>
        </div>
      ) : (
        <div className="stack">
          <label>
            <span>Key name (optional)</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              type="text"
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={allowCreate}
              onChange={(event) => setAllowCreate(event.target.checked)}
            />
            <span>Allow this key to create new buckets</span>
          </label>
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      )}
    </Modal>
  );
}

function KeyEditModal({
  keyItem,
  onClose,
  onSaved,
}: Readonly<{
  keyItem: KeyListItem;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const apiClient = new GarageApiV1Client();
  const [name, setName] = useState(keyItem.name || "");
  const [allowCreate, setAllowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadDetails = async () => {
      setLoadingInfo(true);
      await apiClient
        .getKeyDetails(keyItem.id)
        .then((response) => {
          if (!active) return;
          if (response.name !== undefined && response.name !== null) {
            setName(response.name);
          }
          setAllowCreate(Boolean(response.permissions?.createBucket));
        })
        .catch(() => {
          if (!active) return;
          setAllowCreate(false);
        })
        .finally(() => {
          if (active) setLoadingInfo(false);
        });
    };
    loadDetails();
    return () => {
      active = false;
    };
  }, [keyItem.id]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      await apiClient.updateKeyPermissions(keyItem.id, allowCreate);
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit key"
      onClose={onClose}
      actions={
        <button
          className="primary-button"
          type="button"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      }
    >
      <div className="stack">
        <div>
          <p className="eyebrow">Key ID</p>
          <p className="mono">{keyItem.id}</p>
        </div>
        <label>
          <span>Key name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            type="text"
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={allowCreate}
            onChange={(event) => setAllowCreate(event.target.checked)}
            disabled={loadingInfo}
          />
          <span>Allow this key to create new buckets</span>
        </label>
        {loadingInfo ? <Spinner /> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  );
}

export default function KeysPage() {
  const apiClient = new GarageApiV1Client();
  const [keys, setKeys] = useState<KeyListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editKey, setEditKey] = useState<KeyListItem | null>(null);
  const [deleteKey, setDeleteKey] = useState<KeyListItem | null>(null);
  const [deleteInput, setDeleteInput] = useState("");

  const loadKeys = async () => {
    setLoading(true);
    setError("");
    await apiClient
      .getKeys()
      .then((response) => setKeys(response))
      .catch((error) =>
        setError(
          error instanceof Error ? error.message : "Unable to load keys",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleDelete = async () => {
    console.debug("Deleting key", deleteKey);
    if (!deleteKey) return;
    console.info("DELETE api request key", deleteKey);
    await apiClient.deleteKey(deleteKey.id)
    .then(() => setDeleteKey(null))
    .then(() => setDeleteInput(""))
    .then(() => loadKeys())
    .catch((error) => setError(error instanceof Error ? error.message : "Unable to delete key"));
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>Access keys</h3>
          <p className="muted">Provision and manage storage keys.</p>
        </div>
        <div className="action-row">
          <button
            className="ghost-button"
            type="button"
            onClick={() => setImportOpen(true)}
          >
            Import Key
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            New Key
          </button>
        </div>
      </div>
      {loading ? <div className="centered"> <Spinner /> </div> : null}
      {error ? <div className="centered">  <p className="error-text">{error}</p> </div> : null}
      {!loading && !error ? 
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td className="mono">{key.id}</td>
                <td>{key.name || "Unnamed"}</td>
                <td className="actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setEditKey(key)}
                  >
                    Edit
                  </button>
                  <button
                    className="ghost-button danger"
                    type="button"
                    onClick={() => setDeleteKey(key)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> : null }

      {createOpen ? (
        <KeyCreateModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            loadKeys();
          }}
        />
      ) : null}

      {importOpen ? (
        <Modal title="Import key" onClose={() => setImportOpen(false)}>
          <p>Key import is not defined in the current specs.</p>
        </Modal>
      ) : null}

      {editKey ? (
        <KeyEditModal
          keyItem={editKey}
          onClose={() => setEditKey(null)}
          onSaved={() => {
            setEditKey(null);
            loadKeys();
          }}
        />
      ) : null}

      {deleteKey ? (
        <Modal
          title="Delete key"
          onClose={() => {
            setDeleteKey(null);
            setDeleteInput("");
          }}
          actions={
            <button
              className="primary-button danger"
              type="button"
              disabled={deleteInput !== deleteKey.id}
              onClick={handleDelete}
            >
              Confirm delete
            </button>
          }
        >
          <p>Type the key ID to unlock deletion.</p>
          <div className="stack">
            <div>
              <p className="eyebrow">Key ID</p>
              <p className="mono">{deleteKey.id}</p>
            </div>
            <div>
              <p className="eyebrow">Name</p>
              <p>{deleteKey.name || "Unnamed"}</p>
            </div>
            <input
              type="text"
              value={deleteInput}
              onChange={(event) => setDeleteInput(event.target.value)}
              placeholder="Enter key id"
            />
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

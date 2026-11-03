
// AppSyed device storage
// Private profile data + separate shared family task requests.

(() => {
  "use strict";

  const DB_NAME = "AppSyedDeviceDB";
  const DB_VERSION = 2;
  let databasePromise = null;

  function openDatabase() {
    if (databasePromise) return databasePromise;

    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains("profiles")) {
          db.createObjectStore("profiles", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("tasks")) {
          const tasks = db.createObjectStore("tasks", {
            keyPath: "id"
          });

          tasks.createIndex("profileId", "profileId", {
            unique: false
          });
        }

        // Separate store: only shared task requests.
        // Never put members' private productivity records here.
        if (!db.objectStoreNames.contains("familyRequests")) {
          const requests = db.createObjectStore("familyRequests", {
            keyPath: "id"
          });

          requests.createIndex("status", "status", {
            unique: false
          });

          requests.createIndex("requesterId", "requesterId", {
            unique: false
          });
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        db.onversionchange = () => {
          db.close();
          databasePromise = null;
        };

        resolve(db);
      };

      request.onerror = () => {
        databasePromise = null;
        reject(request.error);
      };
    });

    return databasePromise;
  }

  function runRequest(storeName, mode, action) {
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = action(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);

      transaction.onabort = () => {
        reject(transaction.error || new Error("Storage operation failed."));
      };
    }));
  }

  // Profiles
  function getProfiles() {
    return runRequest("profiles", "readonly", store => store.getAll());
  }

  function getProfile(id) {
    return runRequest("profiles", "readonly", store => store.get(id));
  }

  function saveProfile(profile) {
    return runRequest("profiles", "readwrite", store => store.put(profile));
  }

  function deleteProfile(id) {
    return runRequest("profiles", "readwrite", store => store.delete(id));
  }

  // Private productivity records.
  // Every record belongs to exactly one profile.
  function getTasks(profileId) {
    return openDatabase().then(db => new Promise((resolve, reject) => {
      const transaction = db.transaction("tasks", "readonly");
      const index = transaction.objectStore("tasks").index("profileId");
      const request = index.getAll(profileId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    }));
  }

  function saveTask(task) {
    if (!task || !task.id || !task.profileId) {
      return Promise.reject(new Error("A task needs an ID and profile."));
    }

    return runRequest("tasks", "readwrite", store => store.put(task));
  }

  function deleteTask(id) {
    return runRequest("tasks", "readwrite", store => store.delete(id));
  }

  // Shared family task requests.
  function getFamilyRequests() {
    return runRequest(
      "familyRequests",
      "readonly",
      store => store.getAll()
    );
  }

  function saveFamilyRequest(request) {
    if (!request || !request.id || !request.requesterId) {
      return Promise.reject(
        new Error("A family request needs an ID and requester.")
      );
    }

    return runRequest(
      "familyRequests",
      "readwrite",
      store => store.put(request)
    );
  }

  function deleteFamilyRequest(id) {
    return runRequest(
      "familyRequests",
      "readwrite",
      store => store.delete(id)
    );
  }

  // Storage information
  async function getStorageInfo() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return null;
    }

    return navigator.storage.estimate();
  }

  async function requestPersistentStorage() {
    if (!navigator.storage || !navigator.storage.persist) {
      return false;
    }

    return navigator.storage.persist();
  }

  // Private file storage using OPFS
  async function saveFile(file, profileId, taskId = null) {
    if (!navigator.storage || !navigator.storage.getDirectory) {
      throw new Error(
        "This browser does not support private file storage."
      );
    }

    const root = await navigator.storage.getDirectory();

    const appFolder = await root.getDirectoryHandle(
      "appsyed-files",
      { create: true }
    );

    const profileFolder = await appFolder.getDirectoryHandle(
      profileId,
      { create: true }
    );

    const fileId = crypto.randomUUID();
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const storedName = `${fileId}-${safeName}`;

    const fileHandle = await profileFolder.getFileHandle(
      storedName,
      { create: true }
    );

    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();

    return {
      id: fileId,
      profileId,
      taskId,
      name: file.name,
      storedName,
      type: file.type,
      size: file.size,
      savedAt: new Date().toISOString()
    };
  }

  async function readFile(profileId, storedName) {
    const root = await navigator.storage.getDirectory();

    const appFolder = await root.getDirectoryHandle("appsyed-files");
    const profileFolder = await appFolder.getDirectoryHandle(profileId);
    const fileHandle = await profileFolder.getFileHandle(storedName);

    return fileHandle.getFile();
  }

  window.AppSyedStorage = {
    openDatabase,
    getProfiles,
    getProfile,
    saveProfile,
    deleteProfile,
    getTasks,
    saveTask,
    deleteTask,
    getFamilyRequests,
    saveFamilyRequest,
    deleteFamilyRequest,
    getStorageInfo,
    requestPersistentStorage,
    saveFile,
    readFile
  };
})();

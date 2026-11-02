// AppSyed device storage
// IndexedDB stores profiles and app data on this device.
// OPFS stores uploaded files when the browser supports it.

(() => {
  "use strict";

  const DB_NAME = "AppSyedDeviceDB";
  const DB_VERSION = 1;
  let databasePromise;

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
      };

      request.onsuccess = () => resolve(request.result);

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

  function getProfile(profileId) {
    return runRequest("profiles", "readonly", store => store.get(profileId));
  }

  function saveProfile(profile) {
    return runRequest("profiles", "readwrite", store => store.put(profile));
  }

  function deleteProfile(profileId) {
    return runRequest("profiles", "readwrite", store => store.delete(profileId));
  }

  // Tasks
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
    return runRequest("tasks", "readwrite", store => store.put(task));
  }

  function deleteTask(taskId) {
    return runRequest("tasks", "readwrite", store => store.delete(taskId));
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

  // File storage using OPFS
  async function saveFile(file, profileId, taskId = null) {
    if (!navigator.storage || !navigator.storage.getDirectory) {
      throw new Error(
        "This browser does not support AppSyed's private file storage."
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
    getStorageInfo,
    requestPersistentStorage,
    saveFile,
    readFile
  };
})();

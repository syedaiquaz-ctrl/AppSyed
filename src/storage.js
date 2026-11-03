
(() => {
  "use strict";

  const DB_NAME = "AppSyedDeviceDB";
  const DB_VERSION = 2;

  let databasePromise = null;

  // OPEN DATABASE
  function openDatabase() {
    if (databasePromise) return databasePromise;

    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        const transaction = request.transaction;

        // Profiles
        if (!db.objectStoreNames.contains("profiles")) {
          db.createObjectStore("profiles", {
            keyPath: "id"
          });
        }

        // Private productivity records
        if (!db.objectStoreNames.contains("tasks")) {
          db.createObjectStore("tasks", {
            keyPath: "id"
          });
        }

        const tasks = transaction.objectStore("tasks");

        if (!tasks.indexNames.contains("profileId")) {
          tasks.createIndex("profileId", "profileId", {
            unique: false
          });
        }

        // Separate family request storage
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

      request.onblocked = () => {
        databasePromise = null;
        reject(new Error(
          "Close other AppSyed tabs and reload the website."
        ));
      };
    });

    return databasePromise;
  }

  // GENERAL DATABASE OPERATION
  function run(storeName, mode, action) {
    return openDatabase().then(db =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = action(store);

        let result;

        request.onsuccess = () => {
          result = request.result;
        };

        request.onerror = () => {
          reject(request.error);
        };

        transaction.oncomplete = () => {
          resolve(result);
        };

        transaction.onerror = () => {
          reject(transaction.error);
        };

        transaction.onabort = () => {
          reject(
            transaction.error ||
            new Error("Storage operation failed.")
          );
        };
      })
    );
  }

  // PROFILE FUNCTIONS
  function getProfiles() {
    return run(
      "profiles",
      "readonly",
      store => store.getAll()
    );
  }

  function getProfile(id) {
    return run(
      "profiles",
      "readonly",
      store => store.get(id)
    );
  }

  function saveProfile(profile) {
    return run(
      "profiles",
      "readwrite",
      store => store.put(profile)
    );
  }

  function deleteProfile(id) {
    return run(
      "profiles",
      "readwrite",
      store => store.delete(id)
    );
  }

  // PRIVATE TASK FUNCTIONS
  // Each profile can retrieve its own tasks by profile ID.

  function getTasks(profileId) {
    return openDatabase().then(db =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(
          "tasks",
          "readonly"
        );

        const index = transaction
          .objectStore("tasks")
          .index("profileId");

        const request = index.getAll(profileId);

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(request.error);
        };
      })
    );
  }

  function saveTask(task) {
    if (!task || !task.id || !task.profileId) {
      return Promise.reject(
        new Error("Task ID and profile ID are required.")
      );
    }

    return run(
      "tasks",
      "readwrite",
      store => store.put(task)
    );
  }

  function deleteTask(id) {
    return run(
      "tasks",
      "readwrite",
      store => store.delete(id)
    );
  }

  // FAMILY REQUEST FUNCTIONS
  // These contain only information intentionally
  // submitted for family sharing.

  function getFamilyRequests() {
    return run(
      "familyRequests",
      "readonly",
      store => store.getAll()
    );
  }

  function saveFamilyRequest(request) {
    if (!request || !request.id || !request.requesterId) {
      return Promise.reject(
        new Error("Family request ID and requester ID are required.")
      );
    }

    return run(
      "familyRequests",
      "readwrite",
      store => store.put(request)
    );
  }

  function deleteFamilyRequest(id) {
    return run(
      "familyRequests",
      "readwrite",
      store => store.delete(id)
    );
  }

  // DEVICE STORAGE INFORMATION
  async function getStorageInfo() {
    if (!navigator.storage?.estimate) {
      return null;
    }

    return navigator.storage.estimate();
  }

  async function requestPersistentStorage() {
    if (!navigator.storage?.persist) {
      return false;
    }

    return navigator.storage.persist();
  }

  // PRIVATE FILE STORAGE
  async function saveFile(file, profileId, taskId = null) {
    if (!navigator.storage?.getDirectory) {
      throw new Error(
        "Private file storage is not supported by this browser."
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

    const storedName = fileId + "-" + safeName;

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

    const appFolder = await root.getDirectoryHandle(
      "appsyed-files"
    );

    const profileFolder = await appFolder.getDirectoryHandle(
      profileId
    );

    const fileHandle = await profileFolder.getFileHandle(
      storedName
    );

    return fileHandle.getFile();
  }

  // EXPORT ALL STORAGE FUNCTIONS
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

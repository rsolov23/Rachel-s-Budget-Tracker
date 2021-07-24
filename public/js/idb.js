// create variable to hold db connection
let db;

const request = indexedDB.open("budget_tracker", 1);

// this event will emit if the database version changes (nonexistent to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store (table) called `new_item`, set it to have an auto incrementing primary key of sorts
  db.createObjectStore("new_item", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  if (navigator.onLine) {
    saveRecord();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["new_item"], "readwrite");
  const budgetObjectStore = transaction.objectStore("new_item");

  budgetObjectStore.add(record);
}
// This function will be executed if we attempt to submit a new item and there's no internet connection
function checkDB() {
  // open a transaction on your db
  const transaction = db.transaction(["new_item"], "readwrite");

  // access your object store
  const budgetObjectStore = transaction.objectStore("new_item");

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_item"], "readwrite");
          // access the new_item object store
          const budgetObjectStore = transaction.objectStore("new_item");
          // clear all items in your store
          budgetObjectStore.clear();

          alert("All transactions has been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDB);

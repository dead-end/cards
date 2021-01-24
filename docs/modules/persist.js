/*****************************************************************************
 * The class persists data in the local storage (web storage). The data is the
 * state of a question pool and the key is the name of the file corresponding
 * to that pool.
 ****************************************************************************/
export default class Persist {
  save(id, arr) {
    if (!arr || !Array.isArray(arr)) {
      throw "Object is not an array: " + JSON.stringify(arr);
    }
    localStorage.setItem(id, JSON.stringify(arr));
  }

  // -------------------------------------------------------------------------
  // The function loads an array with a given length from the local storage.
  // If the array was not found or has an other length, the function returns
  // an arry with the requested size which is initialized to 0.
  // -------------------------------------------------------------------------
  load(id, len) {
    let arr = [];

    let data = localStorage.getItem(id);

    if (data) {
      arr = JSON.parse(data);
      if (Array.isArray(arr) && arr.length === len) {
        return arr;
      }
    }

    arr = [];
    for (let i = 0; i < len; i++) {
      arr[i] = 0;
    }
    return arr;
  }

  // -------------------------------------------------------------------------
  // The function is a callback function for the "onLoadedRegistry" event. It
  // is called with an array of the elements of the registry. The member
  // "file" is the interesting part,because it is the key for the local
  // storage.
  //
  // The function ensures that all elements from the localstorage are removed,
  // that are not part of the registry.
  // -------------------------------------------------------------------------
  onLoadedRegistry(arr) {
    //
    // Get an array with the file names
    //
    let files = [];
    for (let i = 0; i < arr.length; i++) {
      files.push(arr[i].file);
    }

    //
    // Remove all items that are not in the registry.
    //
    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);

      if (!files.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  }
}

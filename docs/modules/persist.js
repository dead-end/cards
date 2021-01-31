/******************************************************************************
 * The class persists data in the local storage (web storage). The data is the
 * state of a question pool and the key is the name of the file corresponding
 * to that pool.
 *****************************************************************************/
export default class Persist {
  /****************************************************************************
   * The function saves the object and updates the last modified data.
   ***************************************************************************/
  static save(id, obj) {
    obj.lastmodified = Date.now();
    localStorage.setItem(id, JSON.stringify(obj));
  }

  /****************************************************************************
   * The function loads an array with a given length from the local storage. If
   * the array was not found or has an other length, the function returns an
   * arry with the requested size which is initialized to 0.
   ***************************************************************************/
  static load(id, len) {
    let data = localStorage.getItem(id);

    if (data) {
      let obj = JSON.parse(data);
      if (Array.isArray(obj.answer) && obj.answer.length === len) {
        return obj;
      }
    }

    let obj = {
      answer: [],
    };

    for (let i = 0; i < len; i++) {
      obj.answer[i] = 0;
    }
    return obj;
  }

  /****************************************************************************
   * The function returns the persist object from the storage or null if it
   * does not exist.
   ***************************************************************************/
  static get(id) {
    let data = localStorage.getItem(id);

    if (data) {
      return JSON.parse(data);
    }
  }

  /****************************************************************************
   * The function is a callback function for the "onLoadedRegistry" event. It
   * is called with an array of the elements of the registry. The member "file"
   * is the interesting part,because it is the key for the local storage.
   *
   * The function ensures that all elements from the localstorage are removed,
   * that are not part of the registry.
   ***************************************************************************/
  static onLoadedRegistry(arr) {
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

  /****************************************************************************
   * The function sets all answers to a given value.
   ***************************************************************************/
  static setAll(id, val) {
    let data = localStorage.getItem(id);

    if (!data) {
      return;
    }

    let obj = JSON.parse(data);

    for (let i = 0; i < obj.answer.length; i++) {
      obj.answer[i] = val;
    }

    Persist.save(id, obj);

    return obj;
  }
}

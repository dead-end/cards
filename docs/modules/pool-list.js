import Persist from "./persist.js";

/******************************************************************************
 * The class implements a list with files that contain the question pools.
 *****************************************************************************/

export default class PoolList {
  /****************************************************************************
   * The constructor does the binding for the callback functions.
   ***************************************************************************/
  constructor(dispatcher) {
    this._onSelect = this._onSelect.bind(this);
    this._onButton = this._onButton.bind(this);
    this.dispatcher = dispatcher;
    this.selected = {};
  }

  /****************************************************************************
   * The function is called with an array of integers. Each can have a max
   * value. The function computes a percentage string from the values. 100%
   * means that all entries have the max value.
   ***************************************************************************/
  _percentage(arr, max) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }

    let result = (sum * 100) / (arr.length * max);
    return result.toFixed(0) + "%";
  }

  /****************************************************************************
   * The function checks if the start button is active. This requires that
   * there are unanswered questions.
   ***************************************************************************/
  _isInActive(arr, max) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== max) {
        return false;
      }
    }
    return true;
  }

  /****************************************************************************
   * The function updates a file if the persisted data changed.
   ***************************************************************************/
  _updatePersist(entry, id) {
    let persist = Persist.get(id);

    if (persist) {
      entry.querySelector(".tpl-size").innerText = persist.answer.length;
      entry.querySelector(".tpl-status").innerText = this._percentage(
        persist.answer,
        3
      );

      entry.querySelector(".tpl-modified").innerText = new Date(
        persist.lastmodified
      ).toLocaleString();

      //
      // disable the start button if all questions are learned.
      //
      entry.querySelector(".tpl-start").disabled = this._isInActive(
        persist.answer,
        3
      );
    } else {
      entry.querySelector(".tpl-size").innerText = "";
      entry.querySelector(".tpl-status").innerText = "";
      entry.querySelector(".tpl-modified").innerText = "";
    }
  }

  /****************************************************************************
   * The function creates the tables from the templates.
   ***************************************************************************/
  _show() {
    let temp = document.getElementById("tmpl-pool-list");
    let tplEnty = document.getElementById("tpl-entry");

    let clon = temp.content.cloneNode(true);
    let body = clon.getElementById("pool-list-body");

    for (let i = 0; i < this.files.length; i++) {
      let entry = tplEnty.content.cloneNode(true);

      entry.querySelector(".tpl-title").innerText = this.files[i].title;
      entry.querySelector(".tpl-file").innerText = this.files[i].file;

      this._updatePersist(entry, this.files[i].file);

      //
      // Add the start button
      //
      let button = entry.querySelector(".tpl-start");
      button.setAttribute("data-file-idx", i);
      button.addEventListener("click", this._onButton);

      //
      // Add the select box
      //
      let select = entry.querySelector(".tpl-set");
      select.setAttribute("data-file-idx", i);
      select.addEventListener("change", this._onSelect);

      //
      // Add the result to the dom and the add the id
      //
      body.appendChild(entry);
      body.lastElementChild.id = "tplid-" + this.files[i].file;
    }

    document.getElementById("main").prepend(clon);
  }

  /****************************************************************************
   * The callback function gets the question pool id from the pressed button
   * and fires an event.
   ***************************************************************************/
  _onButton(e) {
    let idx = e.target.getAttribute("data-file-idx");
    this.selected = this.files[idx];
    this.dispatcher.onFileSelected(this.files[idx]);
  }

  /****************************************************************************
   * The callback function which is called to set all ansers to a given value.
   ***************************************************************************/
  _onSelect(e) {
    //
    // We are only intereseted in a positive index.
    //
    if (e.target.selectedIndex) {
      let idx = e.target.getAttribute("data-file-idx");
      let id = this.files[idx].file;

      let val = e.target.selectedIndex - 1;
      Persist.setAll(id, val);

      //
      // Set the index to 0 to restore the orignal state.
      //
      e.target.selectedIndex = 0;

      //
      // Update this component with the new values
      //
      let entry = document.getElementById("tplid-" + id);
      this._updatePersist(entry, id);
    }
  }

  /****************************************************************************
   * The function is a callback function, which is called after the registry
   * was loaded
   ***************************************************************************/
  onLoadedRegistry(files) {
    this.files = files;
    this._show();
  }

  /****************************************************************************
   * Callback function for the stop event.
   ***************************************************************************/
  onStart() {
    //
    // Show the component
    //
    document.getElementById("tpl-table").style.display = "none";
  }

  /****************************************************************************
   * Callback function for the stop event.
   ***************************************************************************/
  onStop() {
    //
    // Hide the component
    //
    document.getElementById("tpl-table").style.display = "";

    //
    // Update the result
    //
    let entry = document.getElementById("tplid-" + this.selected.file);
    this._updatePersist(entry, this.selected.file);

    this.selected = {};
  }
}

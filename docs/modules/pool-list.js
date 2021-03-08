import Persist from "./persist.js";
import { fmtDate, arrPercentage, elemRemoveById } from "./utils.js";

/******************************************************************************
 * The class implements a list with files that contain the question pools.
 *****************************************************************************/

export default class PoolList {
  /****************************************************************************
   * The constructor does the binding for the callback functions.
   ***************************************************************************/
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }

  /****************************************************************************
   * The function updates a file if the persisted data changed.
   ***************************************************************************/
  _updatePersist(entry, id) {
    const persist = Persist.get(id);

    if (persist) {
      entry.querySelector(".pool-entry-status").innerText = arrPercentage(
        persist.answer,
        3
      );

      entry.querySelector(".pool-entry-modified").innerText = fmtDate(
        persist.lastmodified
      );
    } else {
      entry.querySelector(".pool-entry-status").innerText = "";
      entry.querySelector(".pool-entry-modified").innerText = "";
    }
  }

  /****************************************************************************
   * The function creates the tables from the templates.
   ***************************************************************************/
  doShow() {
    const tmplPoolList = document.getElementById("tmpl-pool-list");
    const tmplPoolEntry = document.getElementById("pool-entry");

    const clone = tmplPoolList.content.cloneNode(true);
    const body = clone.getElementById("pool-list-body");

    for (let i = 0; i < this.files.length; i++) {
      const entry = tmplPoolEntry.content.cloneNode(true);

      entry.querySelector(".pool-entry-title").innerText = this.files[i].title;

      this._updatePersist(entry, this.files[i].file);

      //
      // Add the show button
      //
      const button = entry.querySelector(".pool-entry-show");
      button.setAttribute("data-file-idx", i);
      button.addEventListener("click", (e) => {
        const idx = e.target.getAttribute("data-file-idx");
        this.dispatcher.onFileSelected(this.files[idx]);
      });

      //
      // Add the result to the dom and the add the id
      //
      body.appendChild(entry);
    }

    document.getElementById("main").prepend(clone);
  }

  /****************************************************************************
   * The function is a callback function, which is called after the registry
   * was loaded
   ***************************************************************************/
  onLoadedRegistry(files) {
    this.files = files;
    this.doShow();
  }

  /****************************************************************************
   * The function removes the content from the dom.
   ***************************************************************************/
  doHide() {
    elemRemoveById("pool-list-wrapper");
  }
}

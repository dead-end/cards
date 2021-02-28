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
      entry.querySelector(".tpl-status").innerText = arrPercentage(
        persist.answer,
        3
      );

      entry.querySelector(".tpl-modified").innerText = fmtDate(
        persist.lastmodified
      );
    } else {
      entry.querySelector(".tpl-status").innerText = "";
      entry.querySelector(".tpl-modified").innerText = "";
    }
  }

  /****************************************************************************
   * The function creates the tables from the templates.
   ***************************************************************************/
  doShow() {
    const temp = document.getElementById("tmpl-pool-list");
    const tplEnty = document.getElementById("tpl-entry");

    const clone = temp.content.cloneNode(true);
    const body = clone.getElementById("pool-list-body");

    for (let i = 0; i < this.files.length; i++) {
      const entry = tplEnty.content.cloneNode(true);

      entry.querySelector(".tpl-title").innerText = this.files[i].title;

      this._updatePersist(entry, this.files[i].file);

      //
      // Add the show button
      //
      const button = entry.querySelector(".tpl-show");
      button.setAttribute("data-file-idx", i);
      button.addEventListener("click", (e) => {
        const idx = e.target.getAttribute("data-file-idx");
        this.dispatcher.onFileSelected(this.files[idx]);
      });

      //
      // Add the result to the dom and the add the id
      //
      body.appendChild(entry);
      body.lastElementChild.id = "tplid-" + this.files[i].file;
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
    elemRemoveById("tpl-table");
  }
}

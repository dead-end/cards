import { elemRemoveById, elemAppendTmpl, fmtDate } from "./utils.js";

/******************************************************************************
 *
 *****************************************************************************/
export default class ShowFile {
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }

  doShow(file, pool) {
    this.pool = pool;
    this.file = file;

    this._show();
  }

  /****************************************************************************
   * The function removes the component from the dom.
   ***************************************************************************/
  doHide() {
    elemRemoveById("cont-sf");
  }

  /****************************************************************************
   * The function adds the component from the dom.
   ***************************************************************************/
  _show() {
    elemAppendTmpl("tmpl-sf", "main", (clone) => {
      clone.getElementById("sf-title").innerText = this.file.title;
      clone.getElementById("sf-file").innerText = this.file.file;
      clone.getElementById(
        "sf-size"
      ).innerText = this.pool.persist.answer.length;
      clone.getElementById("sf-modified").innerText = fmtDate(
        this.pool.persist.lastmodified
      );

      //
      // Add button listeners
      //
      clone.getElementById("sf-start").onclick = () => {
        this.dispatcher.onStart(this.file, this.pool);
      };
      clone.getElementById("sf-back").onclick = this.dispatcher.onHideFile;
      clone.getElementById("sf-listing").onclick = () => {
        this.dispatcher.onShowListing(this.file, this.pool);
      };
    });
  }
}

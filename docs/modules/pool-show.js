import { elemRemoveById, elemAppendTmpl } from "./utils.js";

/******************************************************************************
 * The class shows the meta data of the pool.
 *****************************************************************************/
export default class PoolShow {
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
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
  doShow(file, pool) {
    elemAppendTmpl("tmpl-sf", "main", (clone) => {
      //
      // Add the pool informations
      //
      clone.getElementById("sf-title").innerText = file.title;
      clone.getElementById("sf-file").innerText = file.file;
      clone.getElementById("sf-size").innerText = pool.persist.answer.length;
      clone.getElementById("sf-status").innerText = pool.getPercentage();
      clone.getElementById("sf-modified").innerText = pool.getLastmodifiedFmt();

      //
      // Add the click handler to start the question / answer loop.
      //
      let button = clone.getElementById("sf-start");
      button.disabled = pool.isLearned();
      button.onclick = () => {
        this.dispatcher.onStart(file, pool);
      };

      //
      // Add the click handler to go back.
      //
      clone.getElementById("sf-back").onclick = this.dispatcher.onHideFile;

      //
      // Add the click handler to show the pool listing.
      //
      clone.getElementById("sf-listing").onclick = () => {
        this.dispatcher.onShowListing(file, pool);
      };

      //
      // Add the click handler for the select box.
      //
      clone.getElementById("sf-set").addEventListener("change", (e) => {
        //
        // Set the number of correct answers.
        //
        pool.addAll(e.target.selectedIndex - 1);

        //
        // Set the index to 0 to restore the orignal state.
        //
        e.target.selectedIndex = 0;

        //
        // Update this view with the new percentage.
        //
        document.getElementById("sf-status").innerText = pool.getPercentage();
        document.getElementById("sf-start").disabled = pool.isLearned();
      });
    });
  }
}

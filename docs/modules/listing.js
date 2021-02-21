import { elemRemoveById, strOrList } from "./utils.js";

/******************************************************************************
 * The class provides a listing of the questions and answers of the question
 * pool.
 *****************************************************************************/

export default class Listing {
  /****************************************************************************
   * The constructor saves the dispatcher for the event handling.
   ***************************************************************************/
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }

  /****************************************************************************
   * The hide method removes the content from the dom.
   ***************************************************************************/
  doHide() {
    elemRemoveById("listing-cont");
  }

  /****************************************************************************
   * The method is called with the file and the pool and it creates the html
   * content.
   ***************************************************************************/
  doShow(file, pool) {
    //
    // We are only interested in the array with the questions and answers.
    //
    let qa = pool.pool;

    //
    // Select the templates from the html.
    //
    let tmplListing = document.getElementById("tmpl-listing");
    let tmplEntry = document.getElementById("tmpl-listing-entry");

    let cloneListing = tmplListing.content.cloneNode(true);
    let wrapper = cloneListing.getElementById("listing-wrap");

    //
    // Clone the template for each question.
    //
    for (let i = 0; i < qa.length; i++) {
      let cloneEntry = tmplEntry.content.cloneNode(true);

      cloneEntry.querySelector(".listing-quest").innerHTML = strOrList(
        qa[i].quest
      );
      cloneEntry.querySelector(".listing-answer").innerHTML = strOrList(
        qa[i].answer
      );

      wrapper.appendChild(cloneEntry);
    }

    //
    // We connect the event dispatcher with the back button.
    //
    cloneListing.getElementById("listing-back").onclick = () => {
      this.dispatcher.onHideListing(file, pool);
    };

    //
    // Add the result to the dom.
    //
    document.getElementById("main").prepend(cloneListing);
  }
}

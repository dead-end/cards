import { elemAppendTmpl, elemRemoveById } from "./utils.js";

/*****************************************************************************
 * The class implements an message component, that adds a message to the dom.
 ****************************************************************************/
export default class MsgComp {
  constructor() {
    this.doShow = false;
  }

  update(msg, details) {
    this.doShow = true;

    elemAppendTmpl("tmpl-msg-div", "main", true, (clone) => {
      clone.getElementById("msg-msg").innerText = msg;
      clone.getElementById("msg-details").innerText = details;
    });
  }

  clear() {
    if (this.doShow) {
      elemRemoveById("msg-div");
      this.doShow = false;
    }
  }
}

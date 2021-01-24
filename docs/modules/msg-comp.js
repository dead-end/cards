/*****************************************************************************
 * The class implements an message component, that adds a message to the dom.
 ****************************************************************************/

export default class MsgComp {
  constructor() {
    this.clear();
  }

  update(msg, details) {
    this.msg = msg;
    this.details = details;

    this._show();
  }

  _show() {
    var temp = document.getElementById("tmpl-msg-div");
    var clon = temp.content.cloneNode(true);

    clon.getElementById("msg-msg").innerText = this.msg;
    clon.getElementById("msg-details").innerText = this.details;

    document.getElementById("main").prepend(clon);
  }

  clear() {
    let elem = document.getElementById("msg-div");
    if (elem) {
      elem.parentNode.removeChild(elem);
    }

    this.msg = "";
    this.details = "";
  }
}

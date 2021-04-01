/*******************************************************************************
 * The class defines the mapping of a char (example: *) to a tag (example: <b>).
 * To produce valid html it has to return <b> and </b> pairwise. The check
 * function ensures that the result is balanced.
 ******************************************************************************/
class Mapping {
  constructor(md, tag) {
    this.md = md;
    this.tag = tag;
    this.count = 0;
  }

  getTag() {
    return ++this.count % 2 ? `<${this.tag}>` : `</${this.tag}>`;
  }

  check() {
    if (this.count % 2) {
      throw new Error(`Unbalanced tag: ${this.md} count: ${this.count}`);
    }

    this.count = 0;
  }
}

/*******************************************************************************
 * The class implements a simple markdown generator. It is called with an array
 * of strings and produces an html fragment. It allows lists:
 *
 * - list item
 * - list item
 *
 * *bold* text
 * ~italic~ text
 * _underline_ text
 ******************************************************************************/

export default class Markdown {
  constructor() {
    this.map = {};

    this._register("_", "u");
    this._register("*", "b");
    this._register("~", "i");

    this.regex = this._pattern();
  }

  _register(chr, tag) {
    this.map[chr] = new Mapping(chr, tag);
  }

  _pattern() {
    let result = "";
    for (let m in this.map) {
      result += m;
    }

    return new RegExp(`[${result}]`, "g");
  }

  tag(chr) {
    if (!this.map.hasOwnProperty(chr)) {
      throw new Error("Unknown element: " + chr);
    }

    return this.map[chr].getTag();
  }

  _check() {
    for (let m in this.map) {
      this.map[m].check();
    }
  }

  _substitute(line) {
    const me = this;

    return line.replaceAll(this.regex, function (elem) {
      return me.tag(elem);
    });
  }

  /****************************************************************************
   * The function is called with a line or an array of lines containing
   * markdown. It return the processed html.
   ***************************************************************************/

  toHtml(lines) {
    if (!Array.isArray(lines)) {
      lines = [lines];
    }

    let inside = false;

    let result = "";

    for (let line of lines) {
      if (line.startsWith("- ")) {
        if (!inside) {
          result += "<ul>";
          inside = true;
        }

        result += "<li>" + this._substitute(line.substring(2).trim()) + "</li>";
        continue;
      }

      if (inside) {
        result += "</ul>";
        inside = false;
      } else if (result !== "") {
        result += "<br />";
      }

      result += this._substitute(line.trim());
    }

    //
    // If the array ends with list, we need the closing tag.
    //
    if (inside) {
      result += "</ul>";
    }

    //
    // ensure that all is balanced
    //
    this._check();

    return result;
  }
}

$(document).ready(function () {
  /*****************************************************************************
   * The function sets a cookie. No parameters are encoded
   ****************************************************************************/

  function cookieSet(name, value, expdays) {
    let d = new Date();
    d.setTime(d.getTime() + expdays * 24 * 60 * 60 * 1000);

    document.cookie =
      name +
      "=" +
      value +
      ";expires=" +
      d.toUTCString() +
      ";path=/;SameSite=Strict";

    //
    // TODO: remove
    //
    console.log(document.cookie);
  }

  /*****************************************************************************
   * The function returns the value of a cookie. No parameters are decoded. An
   * empty string is returned if no cookie with the given name was found.
   ****************************************************************************/

  function cookieGet(name) {
    let pattern = name + "=";
    let arr = document.cookie.split("; ");

    for (let i = 0; i < arr.length; i++) {
      let c = arr[i];
      if (c.startsWith(pattern)) {
        return c.substring(pattern.length, c.length);
      }
    }
    return "";
  }

  /*****************************************************************************
   * The function is called with a char: '0', '1', '2', '3' and returns the
   * integer value.
   ****************************************************************************/

  function char2Int03(c) {
    if (!c || c.length > 1) {
      throw "Input is not a char: " + c;
    }

    let i = c.charCodeAt(0) - "0".charCodeAt(0);

    if (i < 0 || i > 3) {
      throw "Invalid char is not between 0 and 3: " + c;
    }

    return i;
  }

  /*****************************************************************************
   * The function is called with an integer: 0, 1, 2, 3 and returns the
   * corresponding char.
   ****************************************************************************/

  function int2char03(i) {
    switch (i) {
      case 0:
        return "0";

      case 1:
        return "1";

      case 2:
        return "2";

      case 3:
        return "3";

      default:
        throw "Invalid int is not between 0 and 3: " + i;
    }
  }

  /*****************************************************************************
   * The function returns an array where the elements with the given value are
   * removed.
   ****************************************************************************/

  function removeFromArray(array, value) {
    let result = [];

    for (let i = 0; i < array.length; i++) {
      if (array[i] !== value) {
        result.push(array[i]);
      }
    }

    return result;
  }

  /*****************************************************************************
   * The class adds an error message to the dom.
   ****************************************************************************/

  class ErrorMsg {
    msg = "dummy";

    update(msg, reason) {
      this.msg = msg;
      this.reason = reason;

      this.show();
    }

    show() {
      $("#error-div").show();
      $("#error-msg").html(this.msg);
      $("#error-reason").html(this.reason);
    }

    clear() {
      if (this.msg) {
        $("#error-div").hide();
      }

      this.msg = "";
      this.reason = "";
    }
  }

  /*****************************************************************************
   * The function contains a question, the answer, the index in the pool and the
   * number of times the user sets the correct answer.
   ****************************************************************************/

  class Quest {
    constructor(quest, answer, idx, count) {
      this.quest = quest;
      this.answer = answer;
      this.idx = idx;
      this.count = count;
    }

    correct() {
      if (this.count >= 3) {
        return false;
      }
      this.count++;
      return this.count === 3;
    }

    wrong() {
      let changed = this.count !== 0;
      this.count = 0;
      return changed;
    }

    learned() {
      return this.count === 3;
    }

    touched() {
      return this.count !== 0;
    }
  }

  /*****************************************************************************
   * The class represents a pool of questions that is read from a file. The
   * corresponding answer status of each question is stored in a cookie. A valid
   * answer status is: 0, 1, 2, 3. A value of 3 means that the question is
   * learned. The answer status from the cookie is a string os 0-3 values. The
   * index of the char is the index of the question in the pool.
   ****************************************************************************/
  class Pool {
    constructor() {}

    // ------------------------------------------------------------------------
    // The function updates the pool with a new set of questions and its answer
    // status.
    // ------------------------------------------------------------------------
    update(quests, answerStatusStr) {
      this.pool = [];

      let fkt = this.answerStatusFkt(quests, answerStatusStr);

      for (let i = 0; i < quests.length; i++) {
        this.pool[i] = new Quest(quests[i].quest, quests[i].answer, i, fkt(i));
      }
      this.updateLearned();
    }

    // ------------------------------------------------------------------------
    // The function sets all questions in the pool as unlearned.
    // ------------------------------------------------------------------------
    reset() {
      for (let i = 0; i < this.pool.length; i++) {
        this.pool[i].count = 0;
      }

      this.updateLearned();
    }

    // ------------------------------------------------------------------------
    // The function fills the learned / unlearned arrays with the index values
    // from the pool.
    // ------------------------------------------------------------------------
    updateLearned() {
      this.learned = [];
      this.unlearned = [];

      for (let i = 0; i < this.pool.length; i++) {
        if (this.pool[i].learned()) {
          this.learned.push(this.pool[i]);
        } else {
          this.unlearned.push(this.pool[i]);
        }
      }
      this.showStatus();
    }

    // ------------------------------------------------------------------------
    // The function returns a function that gives the answer status of a
    // question from a cookie or a default value.
    // ------------------------------------------------------------------------
    answerStatusFkt(quests, answerStatusStr) {
      if (answerStatusStr === "" || answerStatusStr.length !== quests.length) {
        return function (i) {
          return 0;
        };
      }

      return function (i) {
        return char2Int03(answerStatusStr.charAt(i));
      };
    }

    // ------------------------------------------------------------------------
    // The function computes a status string to be stored in a cookie.
    // ------------------------------------------------------------------------
    status() {
      let result = "";

      for (let i = 0; i < this.pool.length; i++) {
        result += int2char03(this.pool[i].count);
      }

      return result;
    }

    // ------------------------------------------------------------------------
    // The function selects a random answer from the unlearned array.
    // ------------------------------------------------------------------------
    next() {
      let idx = Math.floor(Math.random() * this.unlearned.length);
      this.current = this.unlearned[idx];
      this.showNext();
    }

    // ------------------------------------------------------------------------
    // The function is called if a user marks the answer as correct. The
    // function returns true if the number of learned answers changed.
    // ------------------------------------------------------------------------
    correct() {
      if (this.current.correct()) {
        this.unlearned = removeFromArray(this.unlearned, this.current);
        this.learned.push(this.current);
        this.showStatus();
      }
    }

    // ------------------------------------------------------------------------
    // The function is called if a user marks the answer as wrong. The function
    // returns true if the number of unlearned answers changed.
    // ------------------------------------------------------------------------
    wrong() {
      if (this.current.wrong()) {
        this.learned = removeFromArray(this.learned, this.current);
        this.unlearned.push(this.current);
        this.showStatus();
      }
    }

    // ------------------------------------------------------------------------
    // The function returns if the pool is learned.
    // ------------------------------------------------------------------------
    isLearned() {
      return this.unlearned.length === 0;
    }

    // ------------------------------------------------------------------------
    // The function returns if the pool is reset.
    // ------------------------------------------------------------------------
    isReset() {
      for (let i = 0; i < this.pool.length; i++) {
        if (this.pool[i].touched()) {
          return false;
        }
      }
      return true;
    }

    // ------------------------------------------------------------------------
    // The function adds the changed status to the dom.
    // ------------------------------------------------------------------------
    showStatus() {
      $("#pool-size").html(this.pool.length);
      $("#pool-learned").html(this.learned.length);
      $("#pool-unlearned").html(this.unlearned.length);
    }

    // ------------------------------------------------------------------------
    // The function adds a new question to the dom. The answer is hidden.
    // ------------------------------------------------------------------------
    showNext() {
      $("#question").html(this.current.quest);
      $("#answer").html(this.current.answer);
      $("#pool-current").html(this.current.idx);
      $("#pool-correct").html(this.current.count);

      $(".state-show-answer").toggle();
    }

    print() {
      console.log("idx: " + this.current.idx);
      console.log("learned: " + JSON.stringify(this.learned));
      console.log("unlearned: " + JSON.stringify(this.unlearned));
    }
  }

  /*****************************************************************************
   * The class defines the status of the current file.
   ****************************************************************************/
  class Status {
    constructor() {}

    update(file, title) {
      this.file = file;
      this.title = title;

      this.show();
    }

    show() {
      $("#status-title").html(this.title);
      $("#status-file").html(this.file);
    }
  }

  /*****************************************************************************
   * The function adds the options and the change handler to the file select
   * tag.
   ****************************************************************************/
  function fileSelectCreate(arr) {
    let options =
      '<option disabled="disabled" selected="selected">--- Select File ---</option>';
    for (let i in arr) {
      options += `<option value="${arr[i].file}">${arr[i].title}</option>`;
    }

    $("#select-file").html(options).change(eventDis.fileSelected);
  }

  /*****************************************************************************
   * The function loads the registry file.
   ****************************************************************************/
  function loadRegistry() {
    $.getJSON("registry.json", function (data) {
      fileSelectCreate(data);
    }).fail(function (data) {
      errorMsg.update("Unable to load registry", JSON.stringify(data));
    });
  }

  /*****************************************************************************
   *
   ****************************************************************************/
  class EventDis {
    constructor() {}

    init() {
      $(".state-quest-selected").hide();

      //
      // Change state with: $('.state-quest-start').toggle()
      //
      $("#container-quest").hide();
      $("#container-file").hide();

      $("#state-ready-to-start").hide();

      // $("#div-answer").hide();
    }

    // ------------------------------------------------------------------------
    // The event is triggered if the questioning is ready to start. This means
    // a file is selected and a pool is loaded. We show the start button, if
    // the pool is not jet learned.
    // ------------------------------------------------------------------------
    readyToStart() {
      $("#state-ready-to-start").show();

      if (pool.isLearned()) {
        $("#btn-quest-start").hide();
      } else {
        $("#btn-quest-start").show();
      }

      if (pool.isReset()) {
        $("#btn-quest-reset").hide();
      } else {
        $("#btn-quest-reset").show();
      }
    }

    // ------------------------------------------------------------------------
    // The event is triggered with the reset button. All learned questions are
    // set as unlearned.
    // ------------------------------------------------------------------------
    reset() {
      //
      // If the pool is learned, there is no start button.
      //
      if (pool.isLearned) {
        $("#btn-quest-start").show();
      }

      //
      // If the pool is already reset, we do not have to do anything.
      //
      if (!pool.isReset()) {
        pool.reset();
        cookieSet(status.file, pool.status(), 30);
        $("#btn-quest-reset").hide();
      }
    }

    // ------------------------------------------------------------------------
    // The event is triggered if a file is selected.
    // ------------------------------------------------------------------------
    fileSelected() {
      //
      // Remove previous error messages.
      //
      errorMsg.clear();

      //
      // Store the file in the status
      //
      let title = $("#select-file option:selected").text();
      let file = $("#select-file option:selected").val();
      status.update(file, title);

      $.getJSON(encodeURIComponent(status.file), function (quests) {
        //
        // Update the pool with the new file.
        //
        pool.update(quests, cookieGet(status.file));
        //
        // Show the start and reset button.
        //
        eventDis.readyToStart();
        //
        // Show: file status, pool status
        //
        $("#container-file").show();
      }).fail(function (data) {
        errorMsg.update(
          "Unable to load questions from file: " + status.file,
          JSON.stringify(data)
        );
      });
    }

    // ------------------------------------------------------------------------
    // The event is triggered if the show answer button is pressed.
    // ------------------------------------------------------------------------
    showAnswer() {
      $("#btn-answer-show").hide();
      $(".state-answer-show").show();
    }

    // ------------------------------------------------------------------------
    // The event is triggered if a correct or wrong answer button is pressed.
    // ------------------------------------------------------------------------
    handlerAnswer(event) {
      if (event.target.id === "btn-answer-correct") {
        pool.correct();
      } else if (event.target.id === "btn-answer-wrong") {
        pool.wrong();
      } else {
        throw "Invalid target: " + event.target;
      }

      cookieSet(status.file, pool.status(), 30);

      if (pool.isLearned()) {
        eventDis.stop();
      } else {
        pool.next();
      }
    }

    // ------------------------------------------------------------------------
    // The function is triggered if the start button is pressed.
    // ------------------------------------------------------------------------
    start() {
      $("#btn-answer-show").show();
      $("#btn-answer-correct").hide();
      $("#btn-answer-wrong").hide();
      $(".state-answer-show").hide();

      pool.next();

      $(".state-quest-start").toggle();
      $("#state-quest-selected").show();
      $("#state-ready-to-start").hide();
    }

    // ------------------------------------------------------------------------
    // The function is triggered if the stop button is pressed.
    // ------------------------------------------------------------------------
    stop() {
      $(".state-quest-start").toggle();
      $("#state-quest-selected").hide();
      $("#state-ready-to-start").show();

      eventDis.readyToStart();
    }
  }

  /*****************************************************************************
   * Main
   ****************************************************************************/

  let pool = new Pool();
  let status = new Status();
  let errorMsg = new ErrorMsg();
  let eventDis = new EventDis();

  errorMsg.clear();

  loadRegistry();

  eventDis.init();

  $("#btn-quest-start").click(eventDis.start);
  $("#btn-quest-reset").click(eventDis.reset);
  $("#btn-quest-stop").click(eventDis.stop);
  $("#btn-answer-show").click(eventDis.showAnswer);
  $("#btn-answer-correct").click(eventDis.handlerAnswer);
  $("#btn-answer-wrong").click(eventDis.handlerAnswer);
});

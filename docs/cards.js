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
   * The class generates random numbers.
   ****************************************************************************/
  class Random {
    constructor() {
      this.last = -1;
    }
    next(max) {
      let num = Math.floor(Math.random() * max);

      //
      // Avoid generating the same number twice.
      //
      if (num === this.last) {
        num = Math.floor(Math.random() * max);
      }
      this.last = num;

      return num;
    }
  }

  /*****************************************************************************
   * The class implements an error component, that adds an error message to the
   * dom.
   ****************************************************************************/
  class ErrorComp {
    constructor() {
      this.msg = "remove-me";
      this.clear();
    }

    update(msg, reason) {
      this.msg = msg;
      this.reason = reason;

      this._show();
    }

    _show() {
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
   *
   ****************************************************************************/
  class StartStopComp {
    constructor() {
      this._initButtons();
      this.onStop();
    }

    update(pool) {
      this.pool = pool;
      this._show();
    }

    _initButtons() {
      $("#btn-quest-start").click(eventDis.onStart);
      $("#btn-quest-stop").click(eventDis.onStop);
    }

    onStart() {
      this.running = true;
      this._show();
    }

    onStop() {
      this.running = false;
      this._show();
    }

    _show() {
      if (!this.pool || this.running) {
        $("#state-ready-to-start").hide();
      } else if (this.pool && this.pool.isLearned()) {
        $("#state-ready-to-start").hide();
      } else {
        $("#state-ready-to-start").show();
      }
    }
  }

  /*****************************************************************************
   * The class implements a component that adds a pool statistic to the dom.
   ****************************************************************************/

  class PoolStatComp {
    constructor() {
      this.size = 0;
      this.correct = [];
      this._reset();
      this._initButtons();
      this._show();
    }

    update(pool) {
      this.size = pool.pool.length;
      this._reset();

      for (let i = 0; i < pool.pool.length; i++) {
        this.correct[pool.pool[i].count]++;
      }
      this._show();
    }

    onStart() {
      $(".c-pool-btn").hide();
    }

    onStop() {
      $(".c-pool-btn").show();
    }

    // -------------------------------------------------------------------------
    // The function returns the count from the button id.
    // -------------------------------------------------------------------------
    getCount(id) {
      let count;
      switch (id) {
        case "c-pool-0-btn":
          count = 0;
          break;

        case "c-pool-1-btn":
          count = 1;
          break;

        case "c-pool-2-btn":
          count = 2;
          break;

        case "c-pool-3-btn":
          count = 3;
          break;

        default:
          throw "Unknown button id: " + event.target.id;
      }

      if (this.correct[count] == this.size) {
        return -1;
      }
      return count;
    }

    _reset() {
      this.correct[0] = 0;
      this.correct[1] = 0;
      this.correct[2] = 0;
      this.correct[3] = 0;
    }

    _show() {
      if (this.size > 0) {
        $("#c-pool-size").html(this.size);
        $("#c-pool-0").html(this.correct[0]);
        $("#c-pool-1").html(this.correct[1]);
        $("#c-pool-2").html(this.correct[2]);
        $("#c-pool-3").html(this.correct[3]);

        $("#c-pool-comp").show();
      } else {
        $("#c-pool-comp").hide();
      }
    }

    _initButtons() {
      $("#c-pool-0-btn").click(eventDis.onAddAll);
      $("#c-pool-1-btn").click(eventDis.onAddAll);
      $("#c-pool-2-btn").click(eventDis.onAddAll);
      $("#c-pool-3-btn").click(eventDis.onAddAll);
    }
  }

  /*****************************************************************************
   * The class implements a component that shows informations about the current
   * question.
   ****************************************************************************/
  class QuestInfoComp {
    constructor() {
      this.onStop();
    }

    update(quest) {
      this.quest = quest;
      this._show();
    }

    onStop() {
      $("#c-quest-info").hide();
    }

    onStart() {
      $("#c-quest-info").show();
    }

    _show() {
      $("#c-quest-info-no").html(this.quest.idx);
      $("#c-quest-info-correct").html(this.quest.count);
      $("#c-quest-info-attempt").html(this.quest.attempt);
    }
  }

  /*****************************************************************************
   * The class implements the component, that shows the questions and answers.
   ****************************************************************************/
  class QuestComp {
    constructor() {
      this.onStop();
      this._initButtons();
    }

    update(quest) {
      this.quest = quest;
      this._show();
    }

    _hideAnswer() {
      $(".state-answer-show").hide();
      $("#btn-answer-show").show();
    }

    onShowAnswer() {
      $(".state-answer-show").show();
      $("#btn-answer-show").hide();
    }

    onStop() {
      $("#c-quest-div").hide();
    }

    onStart() {
      $("#c-quest-div").show();
    }

    _initButtons() {
      $("#btn-answer-show").click(eventDis.onShowAnswer);
      $("#btn-answer-correct").click(eventDis.onAnswerCorrect);
      $("#btn-answer-wrong").click(eventDis.onAnswerWrong);
    }

    _show() {
      $("#c-quest-question").html(this.quest.quest);
      $("#c-quest-answer").html(this.quest.answer);

      this._hideAnswer();
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
      this.attempt = 0;
    }

    correct() {
      if (this.count >= 3) {
        return false;
      }
      this.count++;
      this.attempt++;
      return this.count === 3;
    }

    wrong() {
      let changed = this.count !== 0;
      this.count = 0;
      this.attempt++;
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
   * learned. The answer status from the cookie is a string of 0-3 values. The
   * index of the char is the index of the question in the pool.
   ****************************************************************************/
  class Pool {
    constructor() {}

    // -------------------------------------------------------------------------
    // The function updates the pool with a new set of questions and its answer
    // status.
    // -------------------------------------------------------------------------
    _update(quests, answerStatusStr) {
      this.pool = [];

      let fkt = this._answerStatusFkt(quests, answerStatusStr);

      for (let i = 0; i < quests.length; i++) {
        this.pool[i] = new Quest(quests[i].quest, quests[i].answer, i, fkt(i));
      }

      this._poolChanged(false);
    }

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    load(file) {
      $.getJSON(encodeURIComponent(file), function (quests) {
        pool._update(quests, cookieGet(file));
      }).fail(function (data) {
        errorComp.update("Unable to load file: " + file, JSON.stringify(data));
      });
    }

    // -------------------------------------------------------------------------
    // The function sets all questions in the pool as unlearned.
    // -------------------------------------------------------------------------

    addAll(count) {
      for (let i = 0; i < this.pool.length; i++) {
        this.pool[i].count = count;
      }
      this._poolChanged(true);
    }

    // -------------------------------------------------------------------------
    // The function is called if a user marks the answer as correct. The
    // function returns true if the number of learned answers changed.
    // -------------------------------------------------------------------------
    onAnswerCorrect() {
      this.current.correct();
      this._poolChanged(true);

      if (this.isLearned()) {
        eventDis.onStop();
      } else {
        this.next();
      }
    }

    // -------------------------------------------------------------------------
    // The function is called if a user marks the answer as wrong. The function
    // returns true if the number of unlearned answers changed.
    // -------------------------------------------------------------------------
    onAnswerWrong() {
      this.current.wrong();
      this._poolChanged(true);
      this.next();
    }

    // -------------------------------------------------------------------------
    // The function selects a random answer from the unlearned array.
    // -------------------------------------------------------------------------
    next() {
      this.current = this.unlearned[random.next(this.unlearned.length)];
      eventDis.onQuestChanged();
    }

    // -------------------------------------------------------------------------
    // The function returns if the pool is learned.
    // -------------------------------------------------------------------------
    isLearned() {
      return this.unlearned.length === 0;
    }

    // -------------------------------------------------------------------------
    // The function fills the learned / unlearned arrays with the index values
    // from the pool.
    // -------------------------------------------------------------------------
    _updateLearned() {
      this.learned = [];
      this.unlearned = [];

      for (let i = 0; i < this.pool.length; i++) {
        if (this.pool[i].learned()) {
          this.learned.push(this.pool[i]);
        } else {
          this.unlearned.push(this.pool[i]);
        }
      }
    }

    // -------------------------------------------------------------------------
    // The function computes a status string to be stored in a cookie.
    // -------------------------------------------------------------------------
    _cookieValue() {
      let result = "";

      for (let i = 0; i < this.pool.length; i++) {
        result += int2char03(this.pool[i].count);
      }

      return result;
    }

    // -------------------------------------------------------------------------
    // The function is called if the pool has changed.
    // -------------------------------------------------------------------------
    _poolChanged(doPersist) {
      this._updateLearned();
      if (doPersist) {
        cookieSet(status.file, this._cookieValue(), 30);
      }
      eventDis.onPoolChanged();
    }

    // -------------------------------------------------------------------------
    // The function returns a function that gives the answer status of a
    // question from a cookie or a default value.
    // -------------------------------------------------------------------------
    _answerStatusFkt(quests, answerStatusStr) {
      if (answerStatusStr === "" || answerStatusStr.length !== quests.length) {
        return function (i) {
          return 0;
        };
      }

      return function (i) {
        return char2Int03(answerStatusStr.charAt(i));
      };
    }
  }

  /*****************************************************************************
   * The class defines the status of the current file.
   ****************************************************************************/
  class Status {
    // -------------------------------------------------------------------------
    // The constructor initilizes the component with empty data.
    // -------------------------------------------------------------------------
    constructor() {
      this.file = "";
      this.title = "";
      this.onStop();
      this._show();
      this._loadRegistry();
    }

    // -------------------------------------------------------------------------
    // The function loads the files from the registry and creates the select box
    // with the data.
    // -------------------------------------------------------------------------
    _loadRegistry() {
      $.getJSON("registry.json", function (arr) {
        let options =
          '<option disabled="disabled" selected="selected">--- Select File ---</option>';
        for (let i in arr) {
          options += `<option value="${arr[i].file}">${arr[i].title}</option>`;
        }

        $("#c-status-select-file")
          .html(options)
          .change(eventDis.onFileSelected);
      }).fail(function (data) {
        errorComp.update("Unable to load registry", JSON.stringify(data));
      });
    }

    // -------------------------------------------------------------------------
    // Event: file was selected
    // -------------------------------------------------------------------------
    onFileSelected() {
      this.title = $("#c-status-select-file option:selected").text();
      this.file = $("#c-status-select-file option:selected").val();
      this._show();
    }

    // -------------------------------------------------------------------------
    // Event: start button clicked.
    // -------------------------------------------------------------------------
    onStart() {
      $("#c-status-select-div").hide();
    }

    // -------------------------------------------------------------------------
    // Event: stop button clicked.
    // -------------------------------------------------------------------------
    onStop() {
      $("#c-status-select-div").show();
    }

    // -------------------------------------------------------------------------
    // The function shows the file infos.
    // -------------------------------------------------------------------------
    _show() {
      if (this.file) {
        $("#c-status-title").html(this.title);
        $("#c-status-file").html(this.file);
        $("#c-status-info").show();
      } else {
        $("#c-status-info").hide();
      }
    }
  }

  /*****************************************************************************
   *
   ****************************************************************************/
  class EventDis {
    constructor() {}

    // -------------------------------------------------------------------------
    // Event: a file is selected.
    // -------------------------------------------------------------------------
    onFileSelected() {
      //
      // Remove previous error messages.
      //
      errorComp.clear();

      status.onFileSelected();

      pool.load(status.file);
    }

    // -------------------------------------------------------------------------
    // Event: new question pool is loaded
    // -------------------------------------------------------------------------
    onPoolChanged() {
      startStopComp.update(pool);
      poolStatComp.update(pool);
    }

    // -------------------------------------------------------------------------
    // Event: new question was selected.
    // -------------------------------------------------------------------------
    onQuestChanged() {
      questComp.update(pool.current);
      questInfoComp.update(pool.current);
    }

    // -------------------------------------------------------------------------
    // Event: show answer button is clicked
    // -------------------------------------------------------------------------
    onShowAnswer() {
      questComp.onShowAnswer();
    }

    // -------------------------------------------------------------------------
    // Event: correct answer button is clicked
    // -------------------------------------------------------------------------
    onAnswerCorrect(event) {
      pool.onAnswerCorrect();
    }

    // -------------------------------------------------------------------------
    // Event: wrong answer button is clicked
    // -------------------------------------------------------------------------
    onAnswerWrong(event) {
      pool.onAnswerWrong();
    }

    // -------------------------------------------------------------------------
    // Event: start button is clicked.
    // -------------------------------------------------------------------------
    onStart() {
      pool.next();
      status.onStart();
      questComp.onStart();
      questInfoComp.onStart();
      startStopComp.onStart();
      poolStatComp.onStart();
    }

    // -------------------------------------------------------------------------
    // Event: stop button is clicked.
    // -------------------------------------------------------------------------
    onStop() {
      status.onStop();
      questComp.onStop();
      questInfoComp.onStop();
      startStopComp.onStop();
      poolStatComp.onStop();
    }

    // -------------------------------------------------------------------------
    // Event: one of the add all buttons is clicked.
    // -------------------------------------------------------------------------
    onAddAll(event) {
      let count = poolStatComp.getCount(event.target.id);

      //
      // Ensure that something changes.
      //
      if (count < 0) {
        return;
      }
      pool.addAll(count);
    }
  }

  /*****************************************************************************
   * Main
   ****************************************************************************/

  let eventDis = new EventDis();

  let errorComp = new ErrorComp();
  let poolStatComp = new PoolStatComp();
  let questComp = new QuestComp();
  let questInfoComp = new QuestInfoComp();
  let startStopComp = new StartStopComp();

  let random = new Random();

  let pool = new Pool();
  let status = new Status();
});

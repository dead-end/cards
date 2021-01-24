import MsgComp from "./modules/msg-comp.js";
import Persist from "./modules/persist.js";

(function () {
  /*****************************************************************************
   * The function formats a timestamp. If the timestamp is undefined it returns
   * an empty string.
   ****************************************************************************/
  function formatTimestamp(lastmodified) {
    if (!lastmodified) {
      return "";
    }

    let d = new Date();
    d.setTime(lastmodified);

    return `${d.getDate()}.${d.getMonth()}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
  }
  /*****************************************************************************
   * The function loads the requstry, which is a json file.
   ****************************************************************************/
  function loadRegistry() {
    fetch("registry.json")
      .then((response) => {
        if (response.status != 200) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then((json) => {
        eventDis.onLoadedRegistry(json);
      })
      .catch((error) => {
        msgComp.update("Unable to load file: " + file, error);
      });
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
      for (let i = 0; i < 3; i++) {
        let num = Math.floor(Math.random() * max);

        if (num !== this.last) {
          this.last = num;
          break;
        }
      }

      return this.last;
    }
  }

  /*****************************************************************************
   * The class implements a component with the start and stop button.
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
        document.getElementById("btn-quest-start").style.display = "none";
      } else if (this.pool && this.pool.isLearned()) {
        document.getElementById("btn-quest-start").style.display = "none";
      } else {
        document.getElementById("btn-quest-start").style.display = "";
      }
    }

    _initButtons() {
      document.getElementById("btn-quest-start").onclick = eventDis.onStart;
      document.getElementById("btn-quest-stop").onclick = eventDis.onStop;
    }
  }

  /*****************************************************************************
   * The class implements a component that adds a pool statistic to the dom.
   ****************************************************************************/
  class PoolStatComp {
    constructor() {
      this.size = 0;
      this.correct = [];
      this.lastmodified;
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
      this.lastmodified = pool.persist.lastmodified;
      this._show();
    }

    onStart() {
      let elems = document.getElementsByClassName("c-pool-btn");
      for (let i = 0; i < elems.length; i++) {
        elems[i].style.display = "none";
      }
    }

    onStop() {
      let elems = document.getElementsByClassName("c-pool-btn");
      for (let i = 0; i < elems.length; i++) {
        elems[i].style.display = "";
      }
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
          throw "Unknown button id: " + id;
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
        document.getElementById("c-pool-size").innerText = this.size;

        document.getElementById("c-pool-time").innerText = formatTimestamp(
          this.lastmodified
        );

        document.getElementById("c-pool-0").innerText = this.correct[0];
        document.getElementById("c-pool-1").innerText = this.correct[1];
        document.getElementById("c-pool-2").innerText = this.correct[2];
        document.getElementById("c-pool-3").innerText = this.correct[3];

        document.getElementById("c-pool-comp").style.display = "";
      } else {
        document.getElementById("c-pool-comp").style.display = "none";
      }
    }

    _initButtons() {
      document.getElementById("c-pool-0-btn").onclick = eventDis.onAddAll;
      document.getElementById("c-pool-1-btn").onclick = eventDis.onAddAll;
      document.getElementById("c-pool-2-btn").onclick = eventDis.onAddAll;
      document.getElementById("c-pool-3-btn").onclick = eventDis.onAddAll;
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
      document.getElementById("c-quest-info").style.display = "none";
    }

    onStart() {
      document.getElementById("c-quest-info").style.display = "";
    }

    _show() {
      document.getElementById("c-quest-info-no").innerText = this.quest.idx;
      document.getElementById(
        "c-quest-info-correct"
      ).innerText = this.quest.count;
      document.getElementById(
        "c-quest-info-attempt"
      ).innerText = this.quest.attempt;
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
      document.getElementById("btn-answer-show").style.display = "";

      let elems = document.getElementsByClassName("state-answer-show");
      for (let i = 0; i < elems.length; i++) {
        elems[i].style.display = "none";
      }
    }

    onShowAnswer() {
      document.getElementById("btn-answer-show").style.display = "none";

      let elems = document.getElementsByClassName("state-answer-show");
      for (let i = 0; i < elems.length; i++) {
        elems[i].style.display = "";
      }
    }

    onStop() {
      document.getElementById("c-quest-div").style.display = "none";
    }

    onStart() {
      document.getElementById("c-quest-div").style.display = "";
    }

    _show() {
      document.getElementById("c-quest-question").innerText = this.quest.quest;
      let answer;
      if (Array.isArray(this.quest.answer)) {
        answer = "<ul>";
        for (let i = 0; i < this.quest.answer.length; i++) {
          answer += `<li>${this.quest.answer[i]}</li>`;
        }
        answer += "</ul>";
      } else {
        answer = this.quest.answer;
      }

      document.getElementById("c-quest-answer").innerHTML = answer;
      this._hideAnswer();
    }

    _initButtons() {
      document.getElementById("btn-answer-show").onclick =
        eventDis.onShowAnswer;
      document.getElementById("btn-answer-correct").onclick =
        eventDis.onAnswerCorrect;

      document.getElementById("btn-answer-wrong").onclick =
        eventDis.onAnswerWrong;
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
   * corresponding answer status of each question is stored in the local
   * storage. A valid answer status is: 0, 1, 2, 3. A value of 3 means that the
   * question is learned. The answer status from the cookie is a string of 0-3
   * values. The index of the char is the index of the question in the pool.
   ****************************************************************************/
  class Pool {
    constructor() {}

    _update(quests, obj) {
      this.pool = [];
      this.persist = obj;

      for (let i = 0; i < quests.length; i++) {
        this.pool[i] = new Quest(
          quests[i].quest,
          quests[i].answer,
          i,
          this.persist.answer[i]
        );
      }

      this._poolChanged(false);
    }

    load(file) {
      fetch(encodeURIComponent(file))
        .then((response) => {
          if (response.status != 200) {
            throw Error(response.statusText);
          }
          return response.json();
        })
        .then((json) => {
          pool._update(json, Persist.load(file, json.length));
        })
        .catch((error) => {
          msgComp.update("Unable to load file: " + file, error);
        });
    }

    addAll(count) {
      for (let i = 0; i < this.pool.length; i++) {
        this.pool[i].count = count;
      }
      this._poolChanged(true);
    }

    onAnswerCorrect() {
      this.current.correct();
      this._poolChanged(true);

      if (this.isLearned()) {
        eventDis.onStop();
      } else {
        this.next();
      }
    }

    onAnswerWrong() {
      this.current.wrong();
      this._poolChanged(true);
      this.next();
    }

    next() {
      this.current = this.unlearned[random.next(this.unlearned.length)];
      eventDis.onQuestChanged(this.current);
    }

    isLearned() {
      return this.unlearned.length === 0;
    }

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

    _poolChanged(doPersist) {
      this._updateLearned();

      if (doPersist) {
        for (let i = 0; i < this.pool.length; i++) {
          this.persist[i] = this.pool[i].count;
        }

        Persist.save(statusComp.file, this.persist);
      }
      eventDis.onPoolChanged(this);
    }
  }

  /*****************************************************************************
   * The class defines the status of the current file.
   ****************************************************************************/
  class StatusComp {
    constructor() {
      this.file = "";
      this.title = "";
      this.onStop();
      this._show();
    }

    onLoadedRegistry(arr) {
      let options =
        '<option disabled="disabled" selected="selected">--- Select File ---</option>';
      for (let i in arr) {
        options += `<option value="${arr[i].file}">${arr[i].title}</option>`;
      }

      let elem = document.getElementById("c-status-select-file");
      elem.innerHTML = options;
      elem.onchange = eventDis.onFileSelected;
    }

    onFileSelected() {
      let elem = document.getElementById("c-status-select-file");

      this.title = elem.options[elem.selectedIndex].text;
      this.file = elem.options[elem.selectedIndex].value;

      this._show();
    }

    onStart() {
      document.getElementById("c-status-select-div").style.display = "none";
    }

    onStop() {
      document.getElementById("c-status-select-div").style.display = "";
    }

    _show() {
      if (this.file) {
        document.getElementById("c-status-title").innerText = this.title;
        document.getElementById("c-status-file").innerText = this.file;
        document.getElementById("c-status-info").style.display = "";
      } else {
        document.getElementById("c-status-info").style.display = "none";
      }
    }
  }

  /*****************************************************************************
   * The class implements an event dispatcher.
   ****************************************************************************/
  class EventDis {
    constructor() {}

    // -------------------------------------------------------------------------
    // Event: registry was loaded.
    // -------------------------------------------------------------------------
    onLoadedRegistry(arr) {
      statusComp.onLoadedRegistry(arr);
      Persist.onLoadedRegistry(arr);
    }

    // -------------------------------------------------------------------------
    // Event: a file is selected.
    // -------------------------------------------------------------------------
    onFileSelected() {
      //
      // Remove previous error messages.
      //
      msgComp.clear();
      statusComp.onFileSelected();
      pool.load(statusComp.file);
    }

    // -------------------------------------------------------------------------
    // Event: new question pool is loaded
    // -------------------------------------------------------------------------
    onPoolChanged(pool) {
      startStopComp.update(pool);
      poolStatComp.update(pool);
    }

    // -------------------------------------------------------------------------
    // Event: new question was selected.
    // -------------------------------------------------------------------------
    onQuestChanged(quest) {
      questComp.update(quest);
      questInfoComp.update(quest);
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
      statusComp.onStart();
      questComp.onStart();
      questInfoComp.onStart();
      startStopComp.onStart();
      poolStatComp.onStart();
    }

    // -------------------------------------------------------------------------
    // Event: stop button is clicked.
    // -------------------------------------------------------------------------
    onStop() {
      statusComp.onStop();
      questComp.onStop();
      questInfoComp.onStop();
      startStopComp.onStop();
      poolStatComp.onStop();
    }

    // -------------------------------------------------------------------------
    // Event: one of the add all buttons is clicked.
    // -------------------------------------------------------------------------
    onAddAll(event) {
      //
      // The method returns -1 if nothing changed.
      //
      let count = poolStatComp.getCount(event.target.id);
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

  let msgComp = new MsgComp();
  let poolStatComp = new PoolStatComp();
  let questComp = new QuestComp();
  let questInfoComp = new QuestInfoComp();
  let startStopComp = new StartStopComp();

  let random = new Random();

  let pool = new Pool();
  let statusComp = new StatusComp();

  loadRegistry();
})();

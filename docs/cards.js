(function () {
  /*****************************************************************************
   * The function implements an ajax GET request.
   ****************************************************************************/
  function ajaxGet(url, fktOk, fktFail) {
    var request = new XMLHttpRequest();

    request.open("GET", url);

    request.onreadystatechange = function () {
      if (request.readyState == XMLHttpRequest.DONE) {
        if (request.status == 200) {
          fktOk(request.responseText);
        } else {
          fktFail(
            "Unable to load URL: " + url,
            `Status: ${request.status} Msg: ${request.statusText}`
          );
        }
      }
    };

    request.send();
  }
  /*****************************************************************************
   * The function implements an ajax GET request, that returns a JSON object.
   ****************************************************************************/
  function ajaxGetJson(url, fktOk, fktFail) {
    ajaxGet(
      url,
      function (data) {
        try {
          fktOk(JSON.parse(data));
        } catch (e) {
          fktFail("Unable to parse: " + e.fileName, e.message);
        }
      },
      fktFail
    );
  }
  /*****************************************************************************
   * The function loads the requstry, which is a json file.
   ****************************************************************************/
  function loadRegistry() {
    ajaxGetJson(
      "registry.json",
      function (arr) {
        eventDis.onLoadedRegistry(arr);
      },
      function (data) {
        errorComp.update(err, reason);
      }
    );
  }

  /*****************************************************************************
   * The class persists data in the local storage (web storage). The data is the
   * state of a question pool and the key is the name of the file corresponding
   * to that pool.
   ****************************************************************************/
  class Persist {
    save(id, arr) {
      if (!arr || !Array.isArray(arr)) {
        throw "Object is not an array: " + JSON.stringify(arr);
      }
      localStorage.setItem(id, JSON.stringify(arr));
    }

    // -------------------------------------------------------------------------
    // The function loads an array with a given length from the local storage.
    // If the array was not found or has an other length, the function returns
    // an arry with the requested size which is initialized to 0.
    // -------------------------------------------------------------------------
    load(id, len) {
      let arr = [];

      let data = localStorage.getItem(id);

      if (data) {
        arr = JSON.parse(data);
        if (Array.isArray(arr) && arr.length === len) {
          return arr;
        }
      }

      arr = [];
      for (let i = 0; i < len; i++) {
        arr[i] = 0;
      }
      return arr;
    }

    // -------------------------------------------------------------------------
    // The function is a callback function for the "onLoadedRegistry" event. It
    // is called with an array of the elements of the registry. The member
    // "file" is the interesting part,because it is the key for the local
    // storage.
    //
    // The function ensures that all elements from the localstorage are removed,
    // that are not part of the registry.
    // -------------------------------------------------------------------------
    onLoadedRegistry(arr) {
      //
      // Get an array with the file names
      //
      let files = [];
      for (let i = 0; i < arr.length; i++) {
        files.push(arr[i].file);
      }

      //
      // Remove all items that are not in the registry.
      //
      for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);

        if (!files.includes(key)) {
          localStorage.removeItem(key);
        }
      }
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
      document.getElementById("error-div").style.display = "";
      document.getElementById("error-msg").innerText = this.msg;
      document.getElementById("error-reason").innerText = this.reason;
    }

    clear() {
      if (this.msg) {
        document.getElementById("error-div").style.display = "none";
      }

      this.msg = "";
      this.reason = "";
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
      document.getElementById("c-quest-answer").innerText = this.quest.answer;
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

    _update(quests, stateArr) {
      this.pool = [];

      for (let i = 0; i < quests.length; i++) {
        this.pool[i] = new Quest(
          quests[i].quest,
          quests[i].answer,
          i,
          stateArr[i]
        );
      }

      this._poolChanged(false);
    }

    load(file) {
      ajaxGetJson(
        encodeURIComponent(file),
        function (quests) {
          pool._update(quests, persist.load(file, quests.length));
        },
        function (err, reason) {
          errorComp.update(err, reason);
        }
      );
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

    _persistValue() {
      let result = [];

      for (let i = 0; i < this.pool.length; i++) {
        result.push(this.pool[i].count);
      }

      return result;
    }

    _poolChanged(doPersist) {
      this._updateLearned();
      if (doPersist) {
        persist.save(statusComp.file, this._persistValue());
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
      persist.onLoadedRegistry(arr);
    }

    // -------------------------------------------------------------------------
    // Event: a file is selected.
    // -------------------------------------------------------------------------
    onFileSelected() {
      //
      // Remove previous error messages.
      //
      errorComp.clear();
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
  let persist = new Persist();
  let eventDis = new EventDis();

  let errorComp = new ErrorComp();
  let poolStatComp = new PoolStatComp();
  let questComp = new QuestComp();
  let questInfoComp = new QuestInfoComp();
  let startStopComp = new StartStopComp();

  let random = new Random();

  let pool = new Pool();
  let statusComp = new StatusComp();

  loadRegistry();
})();

import MsgComp from "./modules/msg-comp.js";
import Persist from "./modules/persist.js";
import PoolList from "./modules/pool-list.js";

/******************************************************************************
 * The function loads the requstry, which is a json file.
 *****************************************************************************/
function loadRegistry() {
  fetch("registry.json")
    .then((response) => {
      if (response.status != 200) {
        throw Error(response.statusText);
      }
      return response.json();
    })
    .then((json) => {
      dispatcher.onLoadedRegistry(json);
    })
    .catch((error) => {
      msgComp.update("Unable to load file: registry.json", error);
    });
}

/******************************************************************************
 * The function returns an array where the elements with the given value are
 * removed.
 *****************************************************************************/
function removeFromArray(array, value) {
  let result = [];

  for (let i = 0; i < array.length; i++) {
    if (array[i] !== value) {
      result.push(array[i]);
    }
  }

  return result;
}

/******************************************************************************
 * The class generates random numbers.
 *****************************************************************************/
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

/******************************************************************************
 * The class defines the status of the current file.
 *****************************************************************************/
class InfoComp {
  constructor() {
    this.onStop();
  }

  onStart(file) {
    document.getElementById("c-info").style.display = "";

    document.getElementById("c-info-title").innerText = file.title;
    document.getElementById("c-info-file").innerText = file.file;
  }

  onStop() {
    document.getElementById("c-info").style.display = "none";
  }

  onQuestChanged(quest) {
    document.getElementById("c-info-quest-no").innerText = quest.idx;
    document.getElementById("c-info-quest-correct").innerText = quest.count;
    document.getElementById("c-info-quest-attempt").innerText = quest.attempt;
  }

  _updatePoolData(pool) {
    document.getElementById("c-info-size").innerText =
      pool.persist.answer.length;

    let modified = "";
    if (pool.persist.lastmodified) {
      modified = new Date(pool.persist.lastmodified).toLocaleString();
    }
    document.getElementById("c-info-modified").innerText = modified;
  }

  _updatePoolStatus(pool) {
    let correct = [0, 0, 0, 0];

    for (let i = 0; i < pool.pool.length; i++) {
      correct[pool.pool[i].count]++;
    }

    document.getElementById("c-info-pool-0").innerText = correct[0];
    document.getElementById("c-info-pool-1").innerText = correct[1];
    document.getElementById("c-info-pool-2").innerText = correct[2];
    document.getElementById("c-info-pool-3").innerText = correct[3];
  }

  onPoolChanged(pool) {
    this._updatePoolData(pool);
    this._updatePoolStatus(pool);
  }
}

/******************************************************************************
 * The class implements the component, that shows the questions and answers.
 *****************************************************************************/
class QuestComp {
  constructor() {
    this.onStop();
    this._initButtons();
  }

  onQuestChanged(quest) {
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
      dispatcher.onShowAnswer;
    document.getElementById("btn-answer-correct").onclick =
      dispatcher.onAnswerCorrect;

    document.getElementById("btn-answer-wrong").onclick =
      dispatcher.onAnswerWrong;

    document.getElementById("btn-answer-stop").onclick = dispatcher.onStop;
  }
}

/******************************************************************************
 * The function contains a question, the answer, the index in the pool and the
 * number of times the user sets the correct answer.
 *****************************************************************************/
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

/******************************************************************************
 * The class represents a pool of questions that is read from a file. The
 * corresponding answer status of each question is stored in the local
 * storage. A valid answer status is: 0, 1, 2, 3. A value of 3 means that the
 * question is learned. The answer status from the cookie is a string of 0-3
 * values. The index of the char is the index of the question in the pool.
 *****************************************************************************/
class Pool {
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }
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
    this.id = file.file;

    fetch(encodeURIComponent(this.id))
      .then((response) => {
        if (response.status != 200) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then((json) => {
        let persist = Persist.load(this.id, json.length);
        this._update(json, persist);
        this.dispatcher.onStart(file);
      })
      .catch((error) => {
        msgComp.update("Unable to load file: " + this.id, error);
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
      this.dispatcher.onStop();
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
    this.dispatcher.onQuestChanged(this.current);
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
        this.persist.answer[i] = this.pool[i].count;
      }

      Persist.save(this.id, this.persist);
    }
    this.dispatcher.onPoolChanged(this);
  }
}

/******************************************************************************
 * The class implements an event dispatcher.
 *****************************************************************************/
class Dispatcher {
  onLoadedRegistry(files) {
    Persist.onLoadedRegistry(files);
    poolList.onLoadedRegistry(files);
  }

  onFileSelected(file) {
    msgComp.clear();
    pool.load(file);
  }

  onPoolChanged(pool) {
    infoComp.onPoolChanged(pool);
  }

  onQuestChanged(quest) {
    questComp.onQuestChanged(quest);
    infoComp.onQuestChanged(quest);
  }

  onShowAnswer() {
    questComp.onShowAnswer();
  }

  onAnswerCorrect(event) {
    pool.onAnswerCorrect();
  }

  onAnswerWrong(event) {
    pool.onAnswerWrong();
  }

  onStart(file) {
    pool.next();
    questComp.onStart();
    poolList.onStart();
    infoComp.onStart(file);
  }

  onStop() {
    pool.next();
    questComp.onStop();
    poolList.onStop();
    infoComp.onStop();
  }
}

/******************************************************************************
 * Main
 *****************************************************************************/
let dispatcher = new Dispatcher();

let msgComp = new MsgComp();
let questComp = new QuestComp();

let random = new Random();

let pool = new Pool(dispatcher);
let infoComp = new InfoComp();

let poolList = new PoolList(dispatcher);

loadRegistry();

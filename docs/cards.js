import MsgComp from "./modules/msg-comp.js";
import Persist from "./modules/persist.js";
import PoolList from "./modules/pool-list.js";
import ShowFile from "./modules/show-file.js";
import { strOrList, elemRemoveById, elemAppendTmpl } from "./modules/utils.js";

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
    });
}

/******************************************************************************
 * The class implements the component, that shows the questions and answers.
 *****************************************************************************/
class QuestComp {
  constructor() {
    this.visible = false;
  }

  _visAnswer(doShow) {
    document.getElementById("cq-btn-show").style.display = doShow ? "none" : "";

    let elems = document.getElementsByClassName("qa-show-answer");
    for (let i = 0; i < elems.length; i++) {
      elems[i].style.display = doShow ? "" : "none";
    }
  }

  _hideAnswer() {
    this._visAnswer(false);
  }

  onShowAnswer() {
    this._visAnswer(true);
  }

  doShow(file, pool) {
    elemAppendTmpl("tmpl-qa", "main", (clon) => {
      clon.getElementById("qa-pool").innerHTML = file.title;

      clon.getElementById("cq-btn-show").onclick = dispatcher.onShowAnswer;

      clon.getElementById("qa-btn-is-correct").onclick =
        dispatcher.onAnswerCorrect;

      clon.getElementById("qa-btn-is-wrong").onclick = dispatcher.onAnswerWrong;

      clon.getElementById("qa-btn-stop").onclick = dispatcher.onStop;
    });

    this.visible = true;
    //
    // Update with the current pool.
    //
    this.onPoolChanged(pool);
  }

  doHide() {
    elemRemoveById("cont-qa");
    this.visible = false;
  }

  onQuestChanged(quest) {
    document.getElementById("c-quest-question").innerHTML = strOrList(
      quest.quest
    );

    document.getElementById("c-quest-answer").innerHTML = strOrList(
      quest.answer
    );

    document.getElementById("qa-no").innerHTML = quest.idx;
    document.getElementById("qa-correct").innerHTML = quest.count;
    document.getElementById("qa-attempt").innerHTML = quest.attempt;

    this._hideAnswer();
  }

  onPoolChanged(pool) {
    if (!this.visible) {
      return;
    }

    const correct = pool.getCorrect();

    document.getElementById("qa-pool-0").innerText = correct[0];
    document.getElementById("qa-pool-1").innerText = correct[1];
    document.getElementById("qa-pool-2").innerText = correct[2];
    document.getElementById("qa-pool-3").innerText = correct[3];
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
        const persist = Persist.load(this.id, json.length);
        this._update(json, persist);
        this.dispatcher.onShowFile(file, this);
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
    //
    // If we have only one question left we need no random selection.
    //
    if (this.unlearned.length == 1) {
      this.current = this.unlearned[0];
    }

    //
    // Here we have at least two questions remaining and we have to select one randomly.
    //
    else {
      let nextUnlearned;

      for (let i = 0; i < 3; i++) {
        nextUnlearned = this.unlearned[
          Math.floor(Math.random() * this.unlearned.length)
        ];

        //
        // Ensure that we do not had the same question last time. Initially
        // nothing is set.
        //
        if (!this.current || this.current != nextUnlearned) {
          break;
        }
      }

      this.current = nextUnlearned;
    }
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

  getCorrect() {
    let correct = [0, 0, 0, 0];

    for (let i = 0; i < pool.pool.length; i++) {
      correct[this.pool[i].count]++;
    }

    return correct;
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
    questComp.onPoolChanged(pool);
  }

  onQuestChanged(quest) {
    questComp.onQuestChanged(quest);
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

  //
  // Start questions
  //
  onStart(file, pool) {
    showFile.doHide();
    questComp.doShow(file, pool);
    pool.next();
  }

  onStop() {
    questComp.doHide();
    poolList.doShow();
  }

  //
  // Show file
  //
  onShowFile(file, pool) {
    poolList.doHide();
    showFile.doShow(file, pool);
  }

  onHideFile() {
    showFile.doHide();
    poolList.doShow();
  }
}

/******************************************************************************
 * Main
 *****************************************************************************/
let dispatcher = new Dispatcher();

let msgComp = new MsgComp();
let questComp = new QuestComp();

let pool = new Pool(dispatcher);

let poolList = new PoolList(dispatcher);

let showFile = new ShowFile(dispatcher);

loadRegistry();

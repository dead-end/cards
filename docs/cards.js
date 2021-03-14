import MsgComp from "./modules/msg-comp.js";
import Persist from "./modules/persist.js";
import PoolList from "./modules/pool-list.js";
import PoolShow from "./modules/pool-show.js";
import PoolListing from "./modules/pool-listing.js";
import QuestComp from "./modules/quest-comp.js";
import { arrPercentage, fmtDate } from "./modules/utils.js";

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
 * The function contains a question, the answer, the index in the pool and the
 * number of times the user sets the correct answer.
 *****************************************************************************/
class Quest {
  constructor(quest, answer, idx, count) {
    this.quest = quest;
    this.answer = answer;
    this.idx = idx;
    this.count = count;
    this.error = 0;
  }

  correct() {
    if (this.count >= 3) {
      return false;
    }
    this.count++;
    return this.count === 3;
  }

  wrong() {
    const changed = this.count !== 0;
    this.count = 0;
    this.error++;
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

  /****************************************************************************
   * The function sets the number of correct answers to all questions of the
   * pool.
   ***************************************************************************/
  addAll(count) {
    this.pool.forEach((elem) => {
      elem.count = count;
    });
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
    this.learned = this.pool.filter((elem) => elem.learned());
    this.unlearned = this.pool.filter((elem) => !elem.learned());
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
    const correct = [0, 0, 0, 0];

    this.pool.forEach((elem) => {
      correct[elem.count]++;
    });

    return correct;
  }

  getPercentage() {
    return arrPercentage(this.persist.answer, 3);
  }

  getLastmodifiedFmt() {
    return fmtDate(this.persist.lastmodified);
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
    poolShow.doHide();
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
    poolShow.doShow(file, pool);
  }

  onHideFile() {
    poolShow.doHide();
    poolList.doShow();
  }

  //
  // Show Listing
  //
  onShowListing(file, pool) {
    poolShow.doHide();
    poolListing.doShow(file, pool);
  }

  onHideListing(file, pool) {
    poolListing.doHide();
    poolShow.doShow(file, pool);
  }
}

/******************************************************************************
 * Main
 *****************************************************************************/
const dispatcher = new Dispatcher();

const msgComp = new MsgComp();

const questComp = new QuestComp(dispatcher);

const pool = new Pool(dispatcher);

const poolList = new PoolList(dispatcher);

const poolShow = new PoolShow(dispatcher);

const poolListing = new PoolListing(dispatcher);

loadRegistry();

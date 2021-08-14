import Persist from "./Persist.js";
import { arrPercentage, fmtDate, shuffleArr } from "./utils.js";

/******************************************************************************
 * The function contains a question, the answer, the index in the pool and the
 * number of times the user sets the correct answer.
 *****************************************************************************/
class Quest {
  constructor(quest, answer, idx, correct) {
    this.quest = quest;
    this.answer = answer;
    this.idx = idx;
    this.correct = correct;
    this.error = 0;
  }

  onAnswerCorrect() {
    if (this.correct < 3) {
      this.correct++;
    }
  }

  onAnswerWrong() {
    this.correct = 0;
    this.error++;
  }

  learned() {
    return this.correct === 3;
  }

  touched() {
    return this.correct !== 0;
  }
}

/******************************************************************************
 * The class represents a pool of questions that is read from a file. The
 * corresponding answer status of each question is stored in the local
 * storage. A valid answer status is: 0, 1, 2, 3. A value of 3 means that the
 * question is learned. The answer status from the cookie is a string of 0-3
 * values. The index of the char is the index of the question in the pool.
 *****************************************************************************/
export default class Pool {
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
        this.dispatcher.onError("Unable to load file: " + this.id, error);
      });
  }

  /****************************************************************************
   * The function sets the number of correct answers to all questions of the
   * pool.
   ***************************************************************************/
  addAll(correct) {
    this.pool.forEach((elem) => {
      elem.correct = correct;
    });
    this._poolChanged(true);
  }

  onAnswerCorrect() {
    this.current.onAnswerCorrect();
    this._poolChanged(true);

    if (this.isLearned()) {
      this.dispatcher.onStop();
    } else {
      this.next();
    }
  }

  onAnswerWrong() {
    this.current.onAnswerWrong();
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
        nextUnlearned =
          this.unlearned[Math.floor(Math.random() * this.unlearned.length)];

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
    this.unlearned = this.pool.filter((elem) => !elem.learned());
    this._shuffle();
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

  _shuffle() {
    let arr = this.pool
      .filter((elem) => !elem.learned())
      .map((elem) => elem.idx);

    shuffleArr(arr);
  }

  /****************************************************************************
   * The function returns an array with statistic data, which is the number of
   * questions with 0, 1, 2 or 3 correct answers.
   ***************************************************************************/
  getCorrect() {
    const correct = [0, 0, 0, 0];

    this.pool.forEach((elem) => {
      correct[elem.count]++;
    });

    return correct;
  }

  /****************************************************************************
   * The function the percentage of correct answers for this question pool.
   ***************************************************************************/
  getPercentage() {
    return arrPercentage(this.persist.answer, 3);
  }

  /****************************************************************************
   * The function returns a formated last modified string of the pool.
   ***************************************************************************/
  getLastmodifiedFmt() {
    return fmtDate(this.persist.lastmodified);
  }
}

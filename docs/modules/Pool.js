import Persist from "./Persist.js";
import { arrPercentage, fmtDate, shuffleArr } from "./utils.js";

/******************************************************************************
 * The class contains a question, the answer and the number of times the user
 * sets the correct answer. The class also contains the index of the question
 * in the pool. This allows to create an array with indices as a shuffled
 * question array.
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

  isLearned() {
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
  /****************************************************************************
   * The constructor simply registers the event dispatcher.
   ***************************************************************************/
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }

  /****************************************************************************
   * The function is called with the json data from the pool file and the
   * persist object from the local storage. We construct the pool array with
   * the questions and answers fron the pool file and the number of correct
   * answers from the local storage.
   ***************************************************************************/
  _update(json, persist) {
    this.pool = [];
    this.persist = persist;

    for (let i = 0; i < json.length; i++) {
      this.pool[i] = new Quest(
        json[i].quest,
        json[i].answer,
        i,
        this.persist.answer[i]
      );
    }

    //
    // Create the array with the indices from the unlearned questions. The
    // indices are used, because they can be shuffled.
    //
    this._createUnlearned();
    this._poolChanged(false);
  }

  /****************************************************************************
   * The function is called with the name of a pool file, which is also the id
   * of the pool. The pool file contains json and is fetched with an ajax
   * request.
   ***************************************************************************/
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
   * The function is called if the answer of the current question is correct.
   ***************************************************************************/
  onAnswerCorrect() {
    //
    // Increase the learned count for the question.
    //
    this.current.onAnswerCorrect();
    //
    // Push back the question if it is not learned.
    //
    this._pushBack();

    //
    // Persist the changed pool.
    //
    this._poolChanged(true);

    //
    // Check if the complete pool was learned
    //
    if (this.isLearned()) {
      this.dispatcher.onStop();
    }

    //
    // Get the next unlearned.
    //
    else {
      this.next();
    }
  }

  /****************************************************************************
   * The function is called if the answer of the current question is false.
   ***************************************************************************/
  onAnswerWrong() {
    //
    // Mark the question as unlearned.
    //
    this.current.onAnswerWrong();
    //
    // Push back the question to the end of the array of unlearned questions.
    //
    this._pushBack();
    //
    // Persist the changed pool.
    //
    this._poolChanged(true);
    //
    // Get the next question
    //
    this.next();
  }

  /****************************************************************************
   * The function pushes the current question index to the end of the array of
   * unlearned indices if the question was not learned.
   ***************************************************************************/
  _pushBack() {
    if (!this.current.isLearned()) {
      this.unlearned.push(this.current.idx);
    }
  }

  /****************************************************************************
   * The function gets the next question from the array of unlearned.
   ***************************************************************************/
  next() {
    //
    // Remove and asign the first element from the unlearned array.
    //
    this.current = this.pool[this.unlearned.shift()];

    this.dispatcher.onQuestChanged(this.current);

    console.log("current: ", this.current.idx, " unlearned: ", this.unlearned);
  }

  /****************************************************************************
   * The function sets the number of correct answers to all questions of the
   * pool.
   ***************************************************************************/
  addAll(correct) {
    this.pool.forEach((elem) => {
      elem.correct = correct;
    });
    this._createUnlearned();
    this._poolChanged(true);
  }

  /****************************************************************************
   * The function is called if the pool changed.
   ***************************************************************************/
  _poolChanged(doPersist) {
    //
    // If requested save the result to the local storage.
    //
    if (doPersist) {
      for (let i = 0; i < this.pool.length; i++) {
        this.persist.answer[i] = this.pool[i].correct;
      }

      Persist.save(this.id, this.persist);
    }
    //
    // Delegate the event to the event dispatcher.
    //
    this.dispatcher.onPoolChanged(this);
  }

  /****************************************************************************
   * The function creates a shuffled array with the indices of the unlearned
   * questions.
   ***************************************************************************/
  _createUnlearned() {
    this.unlearned = this.pool
      .filter((elem) => !elem.isLearned())
      .map((elem) => elem.idx);

    shuffleArr(this.unlearned);

    console.log("unlearned: ", this.unlearned);
  }

  /****************************************************************************
   * The function checks if all questions of the pool are learned.
   ***************************************************************************/
  isLearned() {
    return this.unlearned.length === 0;
  }

  /****************************************************************************
   * The function returns an array with statistic data, which is the number of
   * questions with 0, 1, 2 or 3 correct answers.
   ***************************************************************************/
  getCorrect() {
    const correct = [0, 0, 0, 0];

    this.pool.forEach((elem) => {
      correct[elem.correct]++;
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

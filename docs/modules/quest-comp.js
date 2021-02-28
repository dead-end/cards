import { elemAppendTmpl, elemRemoveById, strOrList } from "./utils.js";

/******************************************************************************
 * The class implements the component, that shows the questions and answers.
 *****************************************************************************/
export default class QuestComp {
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
    this.visible = false;
  }

  /****************************************************************************
   * The function shows / hides the answer and the corresponding buttons.
   ***************************************************************************/
  _visAnswer(doShow) {
    document.getElementById("cq-btn-show").style.display = doShow ? "none" : "";

    const elems = document.getElementsByClassName("qa-show-answer");
    for (let i = 0; i < elems.length; i++) {
      elems[i].style.display = doShow ? "" : "none";
    }
  }

  /****************************************************************************
   * The function hides the answer.
   ***************************************************************************/
  _hideAnswer() {
    this._visAnswer(false);
  }

  /****************************************************************************
   * The callback function shows the answer.
   ***************************************************************************/
  onShowAnswer() {
    this._visAnswer(true);
  }

  /****************************************************************************
   * The callback function adds a clone of the template to the dom.
   ***************************************************************************/
  doShow(file, pool) {
    elemAppendTmpl("tmpl-qa", "main", (clon) => {
      clon.getElementById("qa-pool").innerHTML = file.title;

      clon.getElementById("cq-btn-show").onclick = this.dispatcher.onShowAnswer;

      clon.getElementById(
        "qa-btn-is-correct"
      ).onclick = this.dispatcher.onAnswerCorrect;

      clon.getElementById(
        "qa-btn-is-wrong"
      ).onclick = this.dispatcher.onAnswerWrong;

      clon.getElementById("qa-btn-stop").onclick = this.dispatcher.onStop;
    });

    this.visible = true;
    //
    // Update with the current pool.
    //
    this.onPoolChanged(pool);
  }

  /****************************************************************************
   * The callback function to hide the component.
   ***************************************************************************/
  doHide() {
    elemRemoveById("cont-qa");
    this.visible = false;
  }

  /****************************************************************************
   * The callback function in case the quest / answer changed.
   ***************************************************************************/
  onQuestChanged(quest) {
    document.getElementById("c-quest-question").innerHTML = strOrList(
      quest.quest
    );

    document.getElementById("c-quest-answer").innerHTML = strOrList(
      quest.answer
    );

    document.getElementById("qa-no").innerText = quest.idx;
    document.getElementById("qa-correct").innerText = quest.count;
    document.getElementById("qa-attempt").innerText = quest.attempt;

    this._hideAnswer();
  }

  /****************************************************************************
   * The callback function in case the pool changed. In this case the number of
   * correct answers is updated.
   ***************************************************************************/
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

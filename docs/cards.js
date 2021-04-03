import MsgComp from "./modules/MsgComp.js";
import Persist from "./modules/Persist.js";
import PoolList from "./modules/PoolList.js";
import PoolListing from "./modules/PoolListing.js";
import PoolShow from "./modules/PoolShow.js";
import QuestComp from "./modules/QuestComp.js";
import Pool from "./modules/Pool.js";

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
    try {
      questComp.onQuestChanged(quest);
    } catch (error) {
      msgComp.update("Unable to show question / answer!", error.message);
    }
  }

  onShowAnswer() {
    questComp.onShowAnswer();
  }

  onAnswerCorrect() {
    pool.onAnswerCorrect();
  }

  onAnswerWrong() {
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
    try {
      poolShow.doHide();
      poolListing.doShow(file, pool);
    } catch (error) {
      msgComp.update("Unable to show pool listing!", error.message);
    }
  }

  onHideListing(file, pool) {
    poolListing.doHide();
    poolShow.doShow(file, pool);
  }

  onError(msg, details) {
    msgComp.update(msg, details);
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

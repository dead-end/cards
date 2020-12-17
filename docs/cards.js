$(document).ready(function() {

  /*****************************************************************************
   * The class defines the status of the current file.
   ****************************************************************************/
  let status = {
    file: '',
    title: '',
    correct: 0,
    wrong: 0,
    questions: [],

    reset: function() {
      this.correct = 0
      this.wrong = 0
      this.statusShow()
    },

    addWrong: function() {
      this.wrong++
      this.statusShow()
    },
 
    addCorrect: function() {
      this.correct++
      this.statusShow()
    },

    statusShow: function() {
      $('#status-title').html(this.title)
      $('#status-file').html(this.file)
      $('#status-questions').html(this.questions.length)
      $('#status-correct').html(this.correct)
      $('#status-wrong').html(this.wrong)
      $('#status-total').html(this.correct + this.wrong)
    },

    nextQuest: function() {
      let idx = Math.floor(Math.random() * status.questions.length)
      $('#question').html(status.questions[idx].quest) 
      $('#answer').html(status.questions[idx].answer) 
    } 
  }

  /*****************************************************************************
   * The function adds an error message to the dom.
   ****************************************************************************/
  function errorShow(msg, reason) {
    $('#error-div').show()
    $('#error-msg').html(msg)
    $('#error-reason').html(reason)
  }

  /*****************************************************************************
   * The function initializes the visibility for the answer. The rest is done 
   * with a toggle call:
   *
   * $('.state-show-answer').toggle()
   ****************************************************************************/
  function showAnswerInit() {
    $('#div-answer').hide()
    $('#btn-answer-show').show()
    $('#btn-answer-correct').hide()
    $('#btn-answer-wrong').hide()
  }
  /*****************************************************************************
   * Th function is called if a file is selected.
   ****************************************************************************/
  function fileSelectHandler() {

    //
    // Remove previous error messages.
    //
    $('#error-div').hide()

    status.title = $('#select-file option:selected').text()
    status.file = $('#select-file option:selected').val()

    $.getJSON(encodeURIComponent(status.file), function(data) {
      status.questions = data

      //
      // Show the start button after the questions are loaded.
      //
      $('#btn-quest-start').show()

    }).fail(function(data) {
      errorShow('Unable to load questions from file: ' + status.file, JSON.stringify(data))
    })
  }

  /*****************************************************************************
   * The function adds the options and the change handler to the file select 
   * tag. 
   ****************************************************************************/
  function fileSelectCreate(arr) {

    let options = '<option disabled="disabled" selected="selected">--- Select File ---</option>'
    for (let i in arr) {
      options += `<option value="${arr[i].file}">${arr[i].title}</option>`
    }

    $('#select-file').html(options).change(fileSelectHandler)
  }

  /*****************************************************************************
   * The function loads the registry file.
   ****************************************************************************/
  function loadRegistry() {
    $.getJSON('registry.json', function(data) {
        fileSelectCreate(data)

    }).fail(function(data) {
      errorShow('Unable to load registry', JSON.stringify(data))
    })
  }

  /*****************************************************************************
   * The handler for the start button. It can be called, after the user selected 
   * a file.
   ****************************************************************************/
  function questStartHandler() {
    $('.state-quest-start').toggle()
    showAnswerInit()
    status.reset()
    status.nextQuest()
  }

  /*****************************************************************************
   * The function is called with a correct / wrong answer button.
   ****************************************************************************/
  function answerHandler(event) {
    if (event.target.id === 'btn-answer-correct') {
      status.addCorrect()
    } else if (event.target.id === 'btn-answer-wrong') {
      status.addWrong()
    } else {
      console.log(event.target)
    }
    status.nextQuest()
    $('.state-show-answer').toggle()
  }

  /*****************************************************************************
   * Main
   ****************************************************************************/

  $('#error-div').hide()

  loadRegistry()

  //
  // Change state with: $('.state-quest-start').toggle()
  //
  $('#container-select').show()
  $('#container-quest').hide()

  $('#btn-quest-start').hide().click(questStartHandler)
  $('#btn-quest-stop').click(function() { $('.state-quest-start').toggle() })

  $('#btn-answer-show').click(function () { $('.state-show-answer').toggle() })
  $('#btn-answer-correct').click(answerHandler)
  $('#btn-answer-wrong').click(answerHandler)
})

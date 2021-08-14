/******************************************************************************
 * The function returns a formated date value or an empty string if the date is
 * not defined.
 *****************************************************************************/
export function fmtDate(date) {
  if (!date) {
    return "";
  }

  const d = new Date();
  d.setTime(date);

  const day = d.getDate() > 9 ? d.getDate() : "0" + d.getDate();
  const month = d.getMonth() > 9 ? d.getMonth() : "0" + d.getMonth();
  const hour = d.getHours() > 9 ? d.getHours() : "0" + d.getHours();
  const minute = d.getMinutes() > 9 ? d.getMinutes() : "0" + d.getMinutes();

  return `${day}.${month}.${d.getFullYear()} ${hour}:${minute}`;
}

/******************************************************************************
 * The function is called with an array of integers. Each can have a max value.
 * The function computes a percentage string from the values. 100% means that
 * all entries have the max value.
 *****************************************************************************/
export function arrPercentage(arr, max) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }

  const result = (sum * 100) / (arr.length * max);
  return result.toFixed(0) + "%";
}

/******************************************************************************
 * The function removes an element with a given id from the dom.
 *****************************************************************************/
export function elemRemoveById(id) {
  const elem = document.getElementById(id);
  elem.parentNode.removeChild(elem);
}

/******************************************************************************
 * The function clones a template and adds it to the dom. A function can be
 * given, to process the clone
 *****************************************************************************/
export function elemAppendTmpl(idTmpl, idParent, isPrepend, fct) {
  const temp = document.getElementById(idTmpl);
  const clone = temp.content.cloneNode(true);

  if (fct) {
    fct(clone);
  }

  if (isPrepend) {
    document.getElementById(idParent).prepend(clone);
  } else {
    document.getElementById(idParent).append(clone);
  }
}

/******************************************************************************
 * The maximum is inclusive and the minimum is inclusive. It is assumed that
 * min and max are integers.
 *****************************************************************************/
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/******************************************************************************
 * The function shuffles an array in place.
 *****************************************************************************/
export function shuffleArr(arr) {
  console.log("before: " + arr);

  let min = 1;
  let max = arr.length - 1;

  for (let i = 0; i < arr.length; i++) {
    let j = getRandomIntInclusive(0, arr.length);

    console.log("i: " + i + " j: " + j);

    if (i === j) {
      continue;
    }

    let tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  console.log("after:  " + arr);
}

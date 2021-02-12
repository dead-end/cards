/******************************************************************************
 * The function is called with a string or an array. It returns the string or
 * an html list of the array.
 *****************************************************************************/

export function strOrList(strOrArr) {
  if (!Array.isArray(strOrArr)) {
    return strOrArr;
  }

  return `<ul>${strOrArr.map((elem) => `<li>${elem}</li>`).join("")}</ul>`;
}

/******************************************************************************
 * The function returns a formated date value or an empty string if the date is
 * not defined.
 *****************************************************************************/
export function fmtDate(date) {
  if (!date) {
    return "";
  }

  let d = new Date();
  d.setTime(date);

  return `${d.getDate()}.${d.getMonth()}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
}

/******************************************************************************
 * The function returns an array where the elements with the given value are
 * removed.
 *****************************************************************************/
export function arrRemove(array, value) {
  let result = [];

  for (let i = 0; i < array.length; i++) {
    if (array[i] !== value) {
      result.push(array[i]);
    }
  }

  return result;
}

/******************************************************************************
 * The function checks if all elements of an array have a given value.
 *****************************************************************************/
export function arrValueIs(arr, value) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== value) {
      return false;
    }
  }
  return true;
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

  let result = (sum * 100) / (arr.length * max);
  return result.toFixed(0) + "%";
}

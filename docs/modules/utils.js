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

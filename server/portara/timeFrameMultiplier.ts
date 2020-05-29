/* Algorithm to convert written time measures to milliseconds
input: string (ex. "minutes")
output: milliseconds 
Example: takes in ("minutes"), returns 60,000 (milliseconds)
*/

export default function timeFrameMultiplier(timeFrame: number | string): number | Error {
  if (timeFrame === 'milliseconds' || timeFrame === 'millisecond' || timeFrame === 'mil' || timeFrame === 'mils' || timeFrame === 'ms') {
    return 1
  } else if (timeFrame === 'seconds' || timeFrame === 'second' || timeFrame === 'sec' || timeFrame === 'secs' || timeFrame === 's') {
    return 1000;
  } else if (timeFrame === 'minutes' || timeFrame === 'minute' || timeFrame === 'min' || timeFrame === 'mins' || timeFrame === 'm') {
    return 1000 * 60;
  } else if (timeFrame === 'hours' || timeFrame === 'hour' || timeFrame === 'h') {
    return 1000 * 60 * 60;
  } else if (timeFrame === 'days' || timeFrame === 'day' || timeFrame === 'd') {
    return 1000 * 60 * 60 * 24;
  } else if (timeFrame === 'weeks' || timeFrame === 'week' || timeFrame === 'w') {
    return 1000 * 60 * 60 * 24 * 7;
  } else if (timeFrame === '' || timeFrame === undefined) {
    return 1000;
  } else {
    return new Error('Not a valid measurement of time!');
  }
}
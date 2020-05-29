export default function throttler(ms) {
  //creates a promise that will resolve itself after the throttled time in milliseconds
  // pushing resolvers into an asynchronous queue to be
  // resolved after a specific time
  //time frame multiplier will change that in the directive
  return new Promise(resolve => setTimeout(resolve, ms));
}
export default function throttler(ms) {
  //creates a promise that will resolve itself after the throttled time in milliseconds
  //time frame multiplier will change that in the directive
  return new Promise(resolve => setTimeout(resolve, ms));
}
export default function throttler(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
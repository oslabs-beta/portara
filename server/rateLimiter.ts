let count: number = 5;

export const rateLimiter = (requestContext: any, responseContext: any, options: any = {
  requestLimit: 10,
  throttleSetting: null,
  timer: 20,
}) => {
  count++;
  console.log(requestContext.context.req.ip)
  if (count >= options.requestLimit) {
    throw new Error(`Request limit exceeded. Try again in ${options.timer} minutes`)
  }
  console.log(count)
}
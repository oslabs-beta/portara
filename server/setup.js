//a configuration for jest test to allow measuring time using the performance.now() method
global.performance = require('perf_hooks').performance;
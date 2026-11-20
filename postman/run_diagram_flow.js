// Compatibility entry point: executes the maintained VNPay Postman collection.
process.argv[2] = 'Functional';
require('./run_collection.cjs');

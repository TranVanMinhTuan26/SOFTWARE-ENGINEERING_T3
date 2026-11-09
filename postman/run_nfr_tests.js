// Compatibility entry point: executes the maintained VNPay Postman collection.
process.argv[2] = 'NonFunctional';
require('./run_collection.cjs');

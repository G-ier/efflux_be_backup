const { initializeAPI } = require("./api/server");
const { pollSQSQueue } = require("./sqs/index");


pollSQSQueue()
initializeAPI()

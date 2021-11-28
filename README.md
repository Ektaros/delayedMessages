The repository from [this article](https://medium.com/@ektaros/rabbitmq-delayed-messages-without-delayed-plugin-94f0e65ea4b0) on how to implement delayed messages with RabbitMQ without using delayed messages plugin

Usage example is located at example.js

If runned with active RabbitMQ at localhost:5672 should print out this
```
Queued at  2021-11-28T14:57:11.801Z
Received at  2021-11-28T14:57:41.814Z Hello world 30 sec delay

Queued at  2021-11-28T14:57:11.795Z
Received at  2021-11-28T14:58:11.804Z Hello world 1 min delay
```

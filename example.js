const amqplib = require('amqplib')
const DelayedQueuesManager = require('./delayedQueuesManager')

amqplib.connect('amqp://localhost:5672/').then(async (connection) => {
  const channel = await connection.createChannel()
  const DESTINATION_QUEUE = 'destinationQueue'
  
  await channel.assertQueue(DESTINATION_QUEUE)
  await channel.consume(DESTINATION_QUEUE, (msg) => {
    const data = JSON.parse(msg.content.toString())
    console.log('\nQueued at ', data.queuedAt)
    console.log('Received at ', new Date(), data.message)
    channel.ack(msg)
  })

  const delayedQueues = new DelayedQueuesManager(channel)

  await delayedQueues.setupDelayedTopology([1, 5, 30])
  delayedQueues.sendWithDelay(DESTINATION_QUEUE, { message: 'Hello world 1 min delay', queuedAt: new Date() }, 1)

  await delayedQueues.setupDelayedTopology([0.5])
  delayedQueues.sendWithDelay(DESTINATION_QUEUE, { message: 'Hello world 30 sec delay', queuedAt: new Date() }, 0.5)
})

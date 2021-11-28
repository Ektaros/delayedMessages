const MS_IN_MINUTE = 60 * 1000

class DelayedQueuesManager {
  constructor(
    channel, // amqplib channel object
    {
      delayExchangeName = 'delay-exchange',
      delayExchangeOptions = { durable: true, autoDelete: false },
      delayQueuePrefix = 'delay-queue',
      delayQueueOptions = { durable: true }
    } = {}
  ) {
    this.channel = channel

    this.delayExchangeName = delayExchangeName
    this.delayExchangeOptions = delayExchangeOptions
    this.delayQueuePrefix = delayQueuePrefix
    this.delayQueueOptions = {
      ...delayQueueOptions,
      deadLetterExchange: '' // must be set as Default exchange
    }
    this.delays = {}
  }

  /**
   * @param {Array<number>|Set<number>} delays - set of all possible delays in minutes
   */
  async setupDelayedTopology(delays) {
    // assert headers exchange
    await this.channel.assertExchange(this.delayExchangeName, 'headers', this.delayExchangeOptions)

    await Promise.all(
      [...delays].map(async (delay) => {
        if (!Number.isFinite(delay) || delay <= 0) throw Error(`Delay ${delay} is not an integer`)

        const delayInMs = delay * MS_IN_MINUTE
        // assert delay queue for each delay with messageTtl set to the delay
        await this.channel.assertQueue(this.getName(delay), {
          ...this.delayQueueOptions,
          messageTtl: delayInMs
        })
        // bind delay queue to the headers exchange by matching delay header
        await this.channel.bindQueue(this.getName(delay), this.delayExchangeName, '', {
          'x-match': 'all',
          delay: delayInMs
        })
        this.delays[delay] = delayInMs
      })
    )
  }

  sendWithDelay(destinationQueue, content, delay, options = {}) {
    if (!this.delays[delay]) throw Error(`Delay ${delay} is not configured`)

    // setup "delay" header
    if (!options.headers) options.headers = {}
    options.headers.delay = this.delays[delay]

    return this.channel.publish(this.delayExchangeName, destinationQueue, Buffer.from(JSON.stringify(content)), options)
  }

  getName(delay) {
    return `${this.delayQueuePrefix}-${delay}`
  }
}
module.exports = DelayedQueuesManager

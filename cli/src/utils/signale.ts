import { Signale } from 'signale'
import chalk from 'chalk'
import { inspect } from 'util'
import getErrorReason from './mqttErrorReason'
import { loadConfig } from '../configs'
import state from '../state'

const configs = loadConfig()
state.setConfigs(configs)

const isLogFormat = state.getConfig('output') === 'log'

const option = {
  config: {
    displayLabel: false,
    displayDate: isLogFormat,
    displayTimestamp: isLogFormat,
  },
}

const signale = new Signale(option)

const formatValue = (value: any) => (typeof value === 'object' ? inspect(value, false, null, true) : value)

const msgLog = (msg: Record<string, any>[]) => {
  const payloadItems = msg.filter((item) => item.label === 'payload')
  const restItems = msg.filter((item) => item.label !== 'payload')

  const payloadStrings = payloadItems.map((item) => formatValue(item.value))
  const otherStrings = restItems.map((item) => `${chalk.green(item.label)}: ${formatValue(item.value)}`)
  const chalkString = `${otherStrings.join(', ')}\n\n${payloadStrings.join('\n')}\n`

  signale.log(chalkString)
}

const basicLog = {
  connecting: (config: boolean | string | undefined, host: string, port = 1883, topic?: string, message?: string) => {
    if (!config) {
      signale.await('Connecting...')
    } else {
      signale.await(
        `Connecting using configuration file, host: ${host}, port: ${port}${topic ? `, topic: ${topic}` : ''}${
          message ? `, message: ${message}` : ''
        }`,
      )
    }
  },
  connected: () => signale.success('Connected'),
  subscribing: (t: string) => signale.await(`Subscribing to ${t}...`),
  subscribed: (t: string) => signale.success(`Subscribed to ${t}`),
  subscriptionNegated: (sub: { topic: string; qos: number }) =>
    signale.error(`Subscription negated to ${sub.topic} with code ${sub.qos}`),
  publishing: () => signale.await('Message publishing...'),
  published: () => signale.success('Message published'),
  enterToPublish: () => signale.success('Connected, press Enter to publish, press Ctrl+C to exit'),
  error: (err: Error) => signale.error(err),
  close: () => signale.error('Connection closed'),
  reconnecting: () => signale.await('Reconnecting...'),
  reconnectTimesLimit: () => signale.error('Exceed the maximum reconnect times limit, stop retry'),
  disconnect: (packet: IDisconnectPacket, clientId?: string) => {
    const { reasonCode } = packet
    const reason = reasonCode === 0 ? 'Normal disconnection' : getErrorReason(reasonCode)
    signale.warn(
      `${
        clientId ? `Client ID: ${clientId}, ` : ''
      }The Broker has actively disconnected, Reason: ${reason} (Code: ${reasonCode})`,
    )
  },
  fileReading: () => signale.await('Reading file...'),
  fileReadSuccess: () => signale.success('Read file successfully'),
}

const benchLog = {
  start: {
    conn: (config: boolean | string | undefined, count: number, interval: number, host: string, port = 1883) => {
      if (!config) {
        signale.info(`Start the connect benchmarking, connections: ${count}, req interval: ${interval}ms`)
      } else {
        signale.info(
          `Start the connect benchmarking, connections: ${count}, req interval: ${interval}ms, host: ${host}, port: ${port}`,
        )
      }
    },
    sub: (
      config: boolean | string | undefined,
      count: number,
      interval: number,
      host: string,
      port = 1883,
      topic: string,
    ) => {
      if (!config) {
        signale.info(
          `Start the subscribe benchmarking, connections: ${count}, req interval: ${interval}ms, topic: ${topic}`,
        )
      } else {
        signale.info(
          `Start the subscribe benchmarking, connections: ${count}, req interval: ${interval}ms, host: ${host}, port: ${port}, topic: ${topic}`,
        )
      }
    },
    pub: (
      config: boolean | string | undefined,
      count: number,
      interval: number,
      messageInterval: number,
      host: string,
      port = 1883,
      topic: string,
      message: string,
    ) => {
      if (!config) {
        signale.info(
          `Start the publish benchmarking, connections: ${count}, req interval: ${interval}ms, message interval: ${messageInterval}ms`,
        )
      } else {
        signale.info(
          `Start the publish benchmarking, connections: ${count}, req interval: ${interval}ms, message interval: ${messageInterval}ms, host: ${host}, port: ${port}, topic: ${topic}, message: ${message}`,
        )
      }
    },
  },
  error: (count: number, total: number, id: string, err: Error) => {
    signale.error(`[${count}/${total}] - Client ID: ${id}, ${err}`)
  },
  close: (count: number, total: number, id: string) => {
    signale.error(`[${count}/${total}] - Client ID: ${id}, Connection closed`)
  },
  reconnecting: (count: number, total: number, id: string) => {
    signale.await(`[${count}/${total}] - Client ID: ${id}, Reconnecting...`)
  },
  reconnected: (count: number, total: number, id: string) => {
    signale.success(`[${count}/${total}] - Client ID: ${id}, Reconnected`)
  },
  reconnectTimesLimit: (count: number, total: number, id: string) => {
    signale.error(`[${count}/${total}] - Client ID: ${id}, Exceed the maximum reconnect times limit, stop retry`)
  },
}

const simulateLog = {
  start: {
    pub: (
      config: boolean | string | undefined,
      count: number,
      interval: number,
      messageInterval: number,
      host: string,
      port = 1883,
      topic: string,
      scenario: string,
    ) => {
      let message = `Start simulation publishing, scenario: ${scenario}, connections: ${count}, req interval: ${interval}ms, message interval: ${messageInterval}ms`
      if (config) {
        message += `, host: ${host}, port: ${port}, topic: ${topic}`
      }
      signale.info(message)
    },
  },
}

export { Signale, signale, msgLog, basicLog, benchLog, simulateLog }

export default signale

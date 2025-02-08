const core = require('@actions/core');
//const github = require('@actions/github');
const { WebClient } = require('@slack/web-api');

const isDev = core.getInput('debug')

async function run() {
  try {
    const channelId = core.getInput('channel-id')
    const text = core.getInput('text')
//    const emoji = core.getInput('emoji')
    const argsStr = core.getInput('args') ?? ''
    const messageId = core.getInput('message-id')
    const method = messageId ? 'update' : 'postMessage'

    if (!channelId) {
      core.setFailed('No channel id provided')
      return
    }

    const token = process.env.SLACK_BOT_TOKEN
    debug('hasToken', token.slice(0,4))
    if (!token) {
      core.setFailed('No token provided')
      return
    }
    
    const client = new WebClient(token)

    const body = {
      channel: channelId,
      ts: messageId,
      text: "Whello!", // Fallback text
      blocks: [{
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": injectArgs(text, getArgs(argsStr))
        }
      }]
    }

    const { ok, ts } = await client.chat[method](body)
    debug('res:', { ok: ok, ts: ts })
    core.setOutput('message-id', ts)
  } catch (error) {
    console.error('error data:', JSON.stringify(error.data))
    core.setFailed(error.message);
  }
}

function getArgs(argsStr) {
  if (!argsStr || argsStr === '') {
    return []
  }

  const args = argsStr.split("\n").map(kv => kv.split("="))
  debug('args:', JSON.stringify(args))
  return args
}

function injectArgs(str, args) {
  const text = args.reduce((txt, [name, val]) => txt.replaceAll(`[${name}]`, val), str)
  debug('text:', text)
  return text
}

function debug(...logs) {
  if (isDev) {
    console.log(...logs)
  }
}

run()

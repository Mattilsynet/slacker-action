const core = require('@actions/core');
const github = require('@actions/github');
const { WebClient } = require('@slack/web-api');

const isDev = core.getInput('debug')

async function run() {
  try {
    const channelId = core.getInput('channel-id')
    const text = core.getInput('text')
    const shortText = core.getInput('short-text')
    const argsStr = core.getInput('args') ?? ''
    const messageId = core.getInput('message-id')
    const replyToId = core.getInput('reply-to-id')
    const method = messageId ? 'update' : 'postMessage'

    if (!channelId) {
      core.setFailed('No channel id provided')
      return
    }

    const token = process.env.SLACK_BOT_TOKEN
    if (!token) {
      core.setFailed('No token provided')
      return
    }

    const { eventName, workflow, runId, sha, repo: repository } = github.context
    const { owner, repo } = repository
    const repoUrl = `https://github.com/${owner}/${repo}`

    const footer = [
      getLink(repoUrl, repo),
      eventName,
      sha ? getLink(`${repoUrl}/commit/${sha}`, 'commit') : '',
      getLink(`${repoUrl}/actions/runs/${runId}`, workflow),
      messageId ? getTimeString() : ''
    ].filter(part => part !== '')
     .join(' | ')

    const body = {
      channel: channelId,
      ts: messageId,
      thread_ts: replyToId,
      text: shortText ?? "Whello!", // Notification text
      blocks: getBlocks(text, argsStr, footer, replyToId),
    }

    const client = new WebClient(token)

    debug(messageId ? 'Updating...' : 'Posting...')
    const { ok, ts } = await client.chat[method](body)
    debug('res:', { ok: ok, ts: ts })

    core.setOutput('message-id', ts)
  } catch (error) {
    console.error('error data:', JSON.stringify(error.data))
    core.setFailed(error.message);
  }
}

function getBlocks(text, argsStr, footer, replyToId) {
  const mrkdwnSection = {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": injectArgs(text, getArgs(argsStr))
    }
  }

  if (replyToId) {
    return [mrkdwnSection]
  }

  return [
    mrkdwnSection,
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": footer
        }
      ]
    }
  ]
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

function getLink(url, txt) {
  return `<${url} | ${txt}>`
}

function getTimeString() {
  const now = new Date()
  const timestamp = Math.floor(now.getTime() / 1000)
  const fallback = now.toUTCString()
  //      <!date^timestamp   ^token_string^optional_link | fallback_text>
  return `<!date^${timestamp}^updated {time} | ${fallback}>`
}

function debug(...logs) {
  if (isDev) {
    console.log(...logs)
  }
}

run()

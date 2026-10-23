import { getInput, setFailed, setOutput } from '@actions/core';
import { context as githubContext } from '@actions/github';
import { WebClient } from '@slack/web-api';

const isDev = getInput('debug')

async function run() {
  try {
    const channelId = getInput('channel-id')
    const text = getInput('text')
    const shortText = getInput('short-text')
    const argsStr = getInput('args') ?? ''
    const messageId = getInput('message-id')
    const replyToId = getInput('reply-to-id')
    const method = messageId ? 'update' : 'postMessage'
    // Bot
    const botName = getInput('bot-name')
    const botIcon = getInput('bot-icon')

    if (!channelId) {
      setFailed('No channel id provided')
      return
    }

    const token = process.env.SLACK_BOT_TOKEN
    if (!token) {
      setFailed('No token provided')
      return
    }

    const { eventName, workflow, runId, sha, repo: repository } = githubContext
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

    // Bot
    if (botName) {
      body.username = botName
    }
    if (botIcon) {
      body.icon_emoji = botIcon
    }

    const client = new WebClient(token)

    debugLog(messageId ? 'Updating...' : 'Posting...')
    const { ok, ts } = await client.chat[method](body)
    debugLog('res:', { ok: ok, ts: ts })

    setOutput('message-id', ts)
  } catch (error) {
    console.error('error data:', JSON.stringify(error.data))
    setFailed(error.message);
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
  debugLog('args:', JSON.stringify(args))
  return args
}

function injectArgs(str, args) {
  const text = args.reduce((txt, [name, val]) => txt.replaceAll(`[${name}]`, val), str)
  debugLog('text:', text)
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

function debugLog(...logs) {
  if (isDev) {
    console.log(...logs)
  }
}

run()

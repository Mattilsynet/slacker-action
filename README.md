# Slacker

Post and update slack messages

## Setup

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
1. Create a new app
1. [optional] Input info about your app in "Display Information"
1. Go to "OAuth & Permissions"
1. Under "Scopes", add an OAuth scope with `chat:write`
1. Under "OAuth Token", install app to your workspace
1. Save the "Bot User OAuth Token" as a secret in your repository
1. Invite your bot to the channel(s) of your choice with: `/invite @[bot name]`
   (_installing the app (integration) in the channel is not sufficient_)

## Usage

1. Basic example:
   ```yaml
   uses: Mattilsynet/slacker-action@master
   with:
       channel-id: <slack channel id>
       text: "Your text here"
   ```
1. With `args`:
   ```yaml
   uses: Mattilsynet/slacker-action@master
   with:
       channel-id: <slack channel id>
       args: |
           "name=val"
           name=val
           repo=${{ github.repository }}
       text: "[name] will be replaced by the value"
   ```
1. With slack emojies:
   ```yaml
   uses: mattilsynet/slacker-action@master
   with:
       channel-id: <slack channel id>
       args: |
           grin=:grin:
           check=:white_check_mark:
       text: "I am so [grin], I approve [check]"
   ```
   `=> "I am so 😁, I approve ✅"`

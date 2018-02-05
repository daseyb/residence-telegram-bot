var TelegramBot = require('node-telegram-bot-api')
var schedule = require('node-schedule')
var config = require('./config.json')

var plugins = {
  'wgGesucht': require('./datasources/wg-gesucht.js')
}

var sessions = {}

var bot = new TelegramBot(config.bot_token, {polling: true})

bot.onText(/\/start/, function (msg, match) {
  console.log('Received a /start command from', msg.chat.title != null ? msg.chat.title : msg.chat.username)

  if (!(msg.chat.id in sessions)) {
    var filter = plugins.wgGesucht.newFilter()

    var job = schedule.scheduleJob('*/5 * * * *', function () {
      plugins.wgGesucht.fetch(filter, function (result) { // TODO refactor
        var session = sessions[msg.chat.id]

        // skip already posted entries
        if (session.lastEntry == null) {
          // TODO this will potentially skip too many entries
          if (result.length > 0) {
            session.lastEntry = result[result.length - 1].url
          }
        } else {
          var lastIndex = -1
          for (var i = result.length - 1; i >= 0; i--) {
            if (result[i].url === session.lastEntry) {
              lastIndex = i
              break
            }
          }
          if (lastIndex !== -1) {
            result.splice(0, lastIndex + 1)
          }
          if (result.length > 0) {
            session.lastEntry = result[result.length - 1].url
          }
        }

        // send
        sendEntries(msg.chat.id, result)
      })
    })

    sessions[msg.chat.id] = {
      filter: filter,
      job: job,
      lastEntry: null
    }

    bot.sendMessage(msg.chat.id, 'Woop woop!')
  }
})

bot.onText(/\/stop/, function (msg, match) {
  console.log('Received a /stop command from', msg.chat.title != null ? msg.chat.title : msg.chat.username)

  if (msg.chat.id in sessions) {
    sessions[msg.chat.id].job.cancel()
    delete sessions[msg.chat.id]

    bot.sendMessage(msg.chat.id, 'Bye :°(')
  }
})

// TODO filter command
bot.onText(/\/filter/, function (msg, match) {
  console.log('Received a /filter command from', msg.chat.title != null ? msg.chat.title : msg.chat.username)

  if (!(msg.chat.id in sessions)) {
    bot.sendMessage(msg.chat.id, 'Enter /start first')
  }

  var filter = sessions[msg.chat.id].filter

  sendFilter(msg.chat.id, filter)
})

function sendEntries (chatId, entries) {
  for (var i = 0; i < entries.length; i++) {
    var message = entries[i].url + '\n'
    message += entries[i].room_count + ' rooms, ' + entries[i].price + '€, ' + entries[i].size + 'm²' + '\n'
    message += 'in ' + entries[i].district + ' from ' + entries[i].from + ' to ' + entries[i].to
    bot.sendMessage(chatId, message)
  }
}

function sendFilter (chatId, filter) {
  var message = 'Current filter options:\n'
  message += JSON.stringify(filter, null, 2)
  bot.sendMessage(chatId, message)
}

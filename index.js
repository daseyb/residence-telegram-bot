var request = require('request')
var cheerio = require('cheerio')
var TelegramBot = require('node-telegram-bot-api')
var schedule = require('node-schedule')
var config = require('./config.json')

/*
var cities = {
  'Aachen': 1
}

var type = {
  'WG-Zimmer': 0,
  '1-Zimmer-Wohnung': 1,
  'Wohnung': 2,
  'Haus': 3
}
*/

var sessions = {}

var bot = new TelegramBot(config.bot_token, {polling: true})

bot.onText(/\/start/, function (msg, match) {
  console.log('Received a /start command from', msg.chat.title != null ? msg.chat.title : msg.chat.username)

  if (!(msg.chat.id in sessions)) {
    var filter = {
      type: 2,
      city: 1,
      unlimited_only: true,
      min_room_count: 2,
      min_size: 50,
      max_price: 1000,
      ignore_districts: ['Eilendorf', 'Richterich', 'Laurensberg', 'Würselen', 'Eschweiler', 'Aachen-Würselen', ' Herzogenrath', 'Burtscheid', 'Frankenberger Viertel']
    }

    var job = schedule.scheduleJob('*/5 * * * *', function () {
      parseWgGesucht(filter, function (result) {
        var session = sessions[msg.chat.id]

        // skip already posted entries
        if (session.lastEntry != null) {
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
        }
        if (result.length > 0) {
          session.lastEntry = result[result.length - 1].url
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

function parseWgGesucht (filter, callback) {
  var options = {
    url: 'http://www.wg-gesucht.de/wohnungen-in-Aachen.' + filter.city + '.' + filter.type + '.0.0.html',
    headers: {
      'User-Agent': 'Wget/1.17.1 (linux-gnu)'
    }
  }
  request(options, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html)

      var result = []

      $('#main_column table#table-compact-list tbody tr:not(.inlistTeaser)').each(function (i, elem) {
        var entry = {
          url: 'http://www.wg-gesucht.de/' + $(this).attr('adid'),
          room_count: parseInt($(this).find('.ang_spalte_zimmer').text().trim(), 10),
          price: parseInt($(this).find('.ang_spalte_miete').text().trim().replace('€', ''), 10),
          size: parseInt($(this).find('.ang_spalte_groesse').text().trim().replace('m²', ''), 10),
          district: $(this).find('.ang_spalte_stadt').text().trim(),
          from: $(this).find('.ang_spalte_freiab').text().trim(),
          to: $(this).find('.ang_spalte_freibis').text().trim() === '' ? 'unlimited' : $(this).find('.ang_spalte_freibis').text().trim()
        }

        if (matchesFiler(entry, filter)) {
          result.push(entry)
        }
      })

      callback(result.reverse())
    } else {
      console.log(error)
    }
  })
}

function matchesFiler (entry, filter) {
  if (filter.unlimited_only && entry.to !== 'unlimited') {
    return false
  }
  if (entry.room_count < filter.min_room_count) {
    return false
  }
  if (entry.size < filter.min_size) {
    return false
  }
  if (entry.price > filter.max_price) {
    return false
  }
  if (filter.ignore_districts.indexOf(entry.district) !== -1) {
    return false
  }
  return true
}

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

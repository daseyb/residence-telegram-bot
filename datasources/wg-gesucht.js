var request = require('request')
var cheerio = require('cheerio')

function fetch (filter, callback) {
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

function newFilter () {
  return {
    type: 2,
    city: 1,
    unlimited_only: true,
    min_room_count: 2,
    min_size: 50,
    max_price: 1000,
    ignore_districts: ['Eilendorf', 'Richterich', 'Laurensberg', 'Würselen', 'Eschweiler', 'Aachen-Würselen', 'Herzogenrath']
  }
}

module.exports = {
  newFilter: newFilter,
  fetch: fetch
}

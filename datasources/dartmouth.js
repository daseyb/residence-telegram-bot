var request = require('request')
var cheerio = require('cheerio')

function fetch (filter, callback) {
  console.log("Fetching!")
  var options = {
    url: 'http://realestate.dartmouth.edu/dartmouth-rentals?field_offered_to_value=' + filter.offered_to +
         '&field_reo_housing_type_value=' + filter.housing_type + 
         '&field_reo_city_tid=' + filter.city + 
         '&field_reo_rent_value=' + filter.rent_value +
         '&field_reo_lease_type_value=' + filter.lease_type +
         '&field_reo_num_bedrooms_value=' + filter.num_bedrooms + 
         '&field_reo_furnished_value=' + filter.furnished + 
         '&field_reo_dr_pets_value=All' +
         '&sort_by=field_reo_city_tid',
    headers: {
      'User-Agent': 'Wget/1.17.1 (linux-gnu)'
    }
  }
  request(options, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html)

      var result = []

      $('.view-content > ul > li > article').each(function (i, elem) {

        var titleElem = $(elem).find('.reo-listing__title > a')
        var content = $(elem).find('.reo-listing__content')

        var entry = {
          url: 'http://realestate.dartmouth.edu/' + titleElem.attr('href'),
          room_count: 1,
          price: 1,
          size: 1,
          district: "All",
          from: "Now",
          to: "Unlimited"
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
  return true

  if (filter.unlimited_only && entry.to !== 'unlimited') {
    return false
  }
  if (entry.room_count < filter.min_room_count || filter.room_count === 'All') {
    return false
  }
  if (entry.size < filter.min_size) {
    return false
  }
  if (entry.price > filter.max_price || filter.price) {
    return false
  }
  if (filter.ignore_districts.indexOf(entry.district) !== -1) {
    return false
  }
  return true
}

function newFilter () {
  return {
    offered_to: 1,
    housing_type: 'All',
    city: 'All',
    rent_value: 'All',
    lease_type: 'All',
    num_bedrooms: 'All',
    furnished: 'All',
  }
}

module.exports = {
  newFilter: newFilter,
  fetch: fetch
}

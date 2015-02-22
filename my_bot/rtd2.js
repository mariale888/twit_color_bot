//
//  RTD2 - Twitter bot that tweets about the most popular github.com news
//  Also makes new friends and prunes its followings.
//
require('path')

var Chance = require('chance'); // load chance

var Bot = require('./bot')
  , config1 = require('../config1.js');

var bot = new Bot(config1)

console.log('RTD2: Running.');

var my_cities = []
my_cities.push({
                key:['Pittsburgh'],
                value: [40.4417, -80.0000]});
my_cities.push({
                key:['Sydney'],
                value: [-33.8683, 151.2086]});
my_cities.push({
                key:['Egypt'],
                value: [26.0000, 30.0000]});
my_cities.push({
                key:['Paris'],
                value: [48.8567, 2.3508]});
my_cities.push({
                key:['Bogota'],
                value: [4.5981, -74.0758]});
my_cities.push({
                key:['San Francisco'],
                value: [37.7833, -122.4167]});
my_cities.push({
                key:['London'],
                value: [51.5072, -0.1275]});
my_cities.push({
                key:['Buenos Aires'],
                value: [-34.6033, 58.3817]});
my_cities.push({
                key:['Bangkok'],
                value: [13.7563, 100.5018]});
my_cities.push({
                key:['Istanbul'],
                value: [41.0136, 28.9550]});
my_cities.push({
                key:['Tashkent'],
                value: [41.2667, 69.2167]});
my_cities.push({
                key:['Lhasa'],
                value: [29.6500, 91.1000]});
my_cities.push({
                key:['Tehran'],
                value: [35.6961, 51.4231]});




//get date string for today's date (e.g. '2011-01-01')
function datestring () {
  var d = new Date(Date.now() - 5*60*60*1000);  //est timezone
  return d.getUTCFullYear()   + '-'
     +  (d.getUTCMonth() + 1) + '-'
     +   d.getDate();
};


// function that sens final tweet with image
function sendTweet(my_color) {
  //console.log(my_color);
  var media = 'out.png';
  bot.tweetMedia(media, function (err,data, reply) {
      if(err) return handleError(err);
        var mediaIdStr = data.media_id_string;
      var params = { status: my_color, media_ids: mediaIdStr } 
        bot.tweet(params, function (err1, data1,reply1) {
          if(err1) return handleError(err1);
          //console.log('\nTweet: ' + (reply1 ? reply1.text : reply1));
      })
  })
}


setInterval(function() {
  bot.twit.get('followers/ids', function(err, reply) {
    if(err) return handleError(err)
    console.log('\n# followers:' + reply.ids.length.toString());
  });

  // get the city of the hour
  var rand_ = Math.floor(Math.random() * my_cities.length);
  var my_city = my_cities[rand_].key[0]
  var my_color = 'The current color temperature of '+ my_city + '! #colorweather ';

  var rand = Math.random();
  var chance = new Chance();
 
  // choose a random city
 if(rand <= 0.50) {      
   // Geocoding
      var city   = chance.coordinates();
      city_name  = chance.city(); 
      city       = city.split(",");

      bot.random_city(city,city_name,function(returnValue) {
        // use the return value here instead of like a regular (non-evented) return value
          if(returnValue != null) {
            //we got city
            if(returnValue.length > 1)  {
               bot.getForecast(city,function(returnV)  {

                my_color = 'The current color temperature of '+ returnValue + '!';//' #colorweather ';  
                bot.makeSentence(returnValue,function(callback)
                {
                  my_color = callback + '! #colorweather ';
                  sendTweet(my_color);
                });
              });
            }
            else {
                bot.getForecast([returnValue.lat , returnValue.lng], function(returnV)  {
                   my_color = 'The current color temperature of '+ city_name + '! #colorweather ';  
                    bot.makeSentence(city_name,function(callback)
                    {
                      my_color = callback + '! #colorweather ';
                      endTweet(my_color);
                    });
               });
            }
          }
          else  {
            bot.getForecast(my_cities[rand_].value, function(returnV)  {
               bot.makeSentence(my_city,function(callback)
                {
                  my_color = callback + '! #colorweather ';
                  sendTweet(my_color);
                });
            });
          }
      });
  } 
  //  add random hashtag
  else {    

    // Instantiate Chance so it can be used
    var my_random_hashtag = chance.hashtag();
    my_color = my_color + my_random_hashtag;
    bot.getForecast(my_cities[rand_].value,function(returnV)  {
      bot.makeSentence(my_city,function(callback)
        {
            my_color = callback + '! #colorweather ' + my_random_hashtag;
            sendTweet(my_color);
        });
    }); 
  }


/*
 // post tweet with image
  var media = 'out.png';
  console.log(my_color);
  bot.tweetMedia(media, function (err,data, reply) {
      if(err) return handleError(err);
        var mediaIdStr = data.media_id_string;
        //console.log(mediaIdStr);
        //console.log(data);
        var params = { status: my_color, media_ids: mediaIdStr } 
        bot.tweet(params, function (err1, data1,reply1) {
          if(err1) return handleError(err1);
          //console.log('\nTweet: ' + (reply1 ? reply1.text : reply1));
        })
  })*/


}, 10000); // change to hr1800000

function handleError(err) {
  console.error('response status:', err.statusCode);
  console.error('data:', err.data);
}

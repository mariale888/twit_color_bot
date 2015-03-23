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
                key:['Cairo'],
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
my_cities.push({
                key:['Mumbai'],
                value: [18.9750, 72.8258]});

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
        bot.tweet_with_art(params, function (err1, data1,reply1) {
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
  var my_color = '';

  var rand = Math.random();
  var chance = new Chance();
 
  // choose a random city
 if(rand <= 0.50) {      
      my_city  = chance.city();
  } 
  //make a friend    
  if(rand <= 0.3) {
    bot.mingle(function(err, reply) {
      if(err) return handleError(err);
      var name = reply.screen_name;
      console.log('\nNietzsche: followed @' + name);
    });
  }
  

  //get info and publish tweet
  var info = '';
  bot.getNews(my_city,function(returnValue)  { 

      if(info == '')  {
          info = returnValue;
          bot.makeSentence_1(info,function(callback) {
            my_color = callback + '! #' + my_city.replace(' ','');
            
            bot.tweet(my_color, function (err, reply) {
               if(err) return handleError(err);
               console.log('\nTweet: ' + (reply ? reply.text : reply));
              })
          });
        }
  });


}, 1200000); // 30min = 1800000 // 20min = 1200000

function handleError(err) {
  console.error('response status:', err.statusCode);
  console.error('data:', err.data);
}

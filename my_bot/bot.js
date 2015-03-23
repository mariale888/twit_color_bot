//
//  Bot
//  class for performing various twitter actions
//
var Twit = require('../lib/twitter');
var Forecast = require('forecast');
var fs = require('fs'),
    PNG = require('pngjs').PNG;
var geocoder = require('geocoder');
var restclient = require('node-restclient');

var GoogleNews = require('google-news');
var WordPOS = require('wordpos');
var wordpos = new WordPOS();

var Bot = module.exports = function(config) { 
  this.twit = new Twit(config);

  this.forecast = new Forecast({
                  service: 'forecast.io',
                  key: 'd4aa0f314553420350d2cc4cad6099bc',
                  units: 'fahrenheit', // Only the first letter is parsed 
                  cache: true,      // Cache API requests? 
                  ttl: {            // How long to cache requests. Uses syntax from moment.js: http://momentjs.com/docs/#/durations/creating/ 
                    minutes: 27,
                    seconds: 45
                    }
                });

  this.fs;
  this.geocoder;

  // insert your Wordnik API info below
this.getNounsURL = "http://api.wordnik.com/v4/words.json/randomWords?" +
                  "minCorpusCount=1000&minDictionaryCount=10&" +
                  "excludePartOfSpeech=proper-noun,proper-noun-plural,proper-noun-posessive,suffix,family-name,idiom,affix&" +
                  "hasDictionaryDef=true&includePartOfSpeech=noun&limit=2&maxLength=12&" +
                  "api_key=2ce45a1afe880c59f50000da91b03cc52677361bc627e6026";

  this.getAdjsURL =  "http://api.wordnik.com/v4/words.json/randomWords?" +
                  "hasDictionaryDef=true&includePartOfSpeech=adjective&limit=2&" + 
                  "minCorpusCount=100&api_key=2ce45a1afe880c59f50000da91b03cc52677361bc627e6026";


  this.googleNews = new GoogleNews();
  
 
};


// 
// get news from current city
//
Bot.prototype.stopNews = function () {
  this.googleNews.stream.disconnect();
}

Bot.prototype.getNews = function (city, callback) {

  this.googleNews.stream(city, function(stream) {
      stream.on(GoogleNews.DATA, function(data) {
         stream.disconnect();
         return callback(data.title);
        //return console.log('Data Event received... ' + data.title);
      });
  
      stream.on(GoogleNews.ERROR, function(error) {
        stream.disconnect();
        return console.log('Error Event received... ' + error);
      });
    });
}

// 
// get weather forcast for current coordinate
//
Bot.prototype.getForecast = function (coordinates, callback)  {

  var self = this;
  color = [0,0,0];
  // Retrieve weather information from coordinates (Sydney, Australia) 
  this.forecast.get(coordinates, function(err, weather) {
    if(err) return console.dir(err);

    // getting the current place of and temperature of place
    place = "The Moon";
    temp = 0;
    humidity = 0 ;
    precipIntensity = 0;
    for (var event in weather)  {
      var cur = weather[event];
      if(event == 'timezone')
        place = cur;
      if(event == 'currently')  {
        for (var t in weather[event]) {
          //console.log(t);
          if(t == 'temperature')
            temp = weather[event][t];
          if(t == 'humidity')
            humidity = weather[event][t];
          if(t == 'precipIntensity')
            precipIntensity = weather[event][t];
        }
      }
    }

    R = remap(temp,0,100,0,255);
    G = remap(humidity,0,1,0,255);
    B = 255 - remap(temp,0,100,0,255);
    color = [Math.ceil(R),Math.ceil(G),Math.ceil(B)];
    console.log("color: " + color);
  
    //console.log(place);
    //console.log(temp);
    //console.log(humidity);
    //console.log(precipIntensity);
    //console.log(pp);
    //console.dir(weather);
    
    fs.createReadStream('in.png')
    .pipe(new PNG({
        filterType: 4
    }))
    .on('parsed', function() {

        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var idx = (this.width * y + x) << 2;
                // invert color
                this.data[idx] = color[0];
                this.data[idx+1] = color[1];
                this.data[idx+2] = color[2];

                // and reduce opacity
                //this.data[idx+3] = this.data[idx+3] >> 1;
            }
        }
        this.pack().pipe(fs.createWriteStream('out.png'));
        return callback(true);
    });

  });
  
}     

//
//  get new random city
//
Bot.prototype.random_city = function (coordinates, city_name, callback) {
  // Reverse Geocoding
 //console.log("S " + city_name);
    geocoder.reverseGeocode( coordinates[0], coordinates[1], function ( err, data ) {
      // do stuff with data
      if(data.results.length > 1)  {
       var name = data.results[1].formatted_address;
       return callback(name);  
      }
      else
      {
        geocoder.geocode(city_name, function ( err, data ) {
          // do stuff with data
          if(data.results.length > 0)  {
            loc = data.results[0].geometry.location;
            return callback(loc);
          }
          else
            return callback(null);
        });
      }
    });

 }
//
//  post a tweet
//
Bot.prototype.tweet = function (status, callback) {
  if(typeof status !== 'string') {
    return callback(new Error('tweet must be of type String'));
  } else if(status.length > 140) {
    return callback(new Error('tweet is too long: ' + status.length));
  }
  this.twit.post('statuses/update', { status: status }, callback);
};


Bot.prototype.tweet_with_art = function (params, callback) {
 
  /*(if(typeof status !== 'string') {
    return callback(new Error('tweet must be of type String'));
  } else if(status.length > 140) {
    return callback(new Error('tweet is too long: ' + status.length));
  }*/
  this.twit.post('statuses/update', params , callback);
  //this.twit.post('statuses/update', { status: status }, callback);
};
Bot.prototype.tweetMedia = function (img, callback) {

 var b64content = fs.readFileSync(img, { encoding: 'base64' })
  this.twit.post('media/upload', { media: b64content }, callback);
};

//
//  choose a random friend of one of your followers, and follow that user
//
Bot.prototype.mingle = function (callback) {
  var self = this;
  
  this.twit.get('followers/ids', function(err, reply) {
      if(err) { return callback(err); }
      
      var followers = reply.ids
        , randFollower  = randIndex(followers);
        
      self.twit.get('friends/ids', { user_id: randFollower }, function(err, reply) {
          if(err) { return callback(err); }
          
          var friends = reply.ids
            , target  = randIndex(friends);
            
          self.twit.post('friendships/create', { id: target }, callback); 
        })
    })
};

//
//  making sentence for current color tweer
//
Bot.prototype.makeSentence = function (city, callback) {
  var self = this;
  var statement = "";
  var city_con = "color temperature of "+ city;
  
  restclient.get(this.getNounsURL,
  function(data) {
    first = data[0].word.substr(0,1);
    first2 = data[1].word.substr(0,1);
    article = "The";
    article2 = "a";
    if (first2 === 'a' ||
        first2 === 'e' ||
        first2 === 'i' ||
        first2 === 'o' ||
        first2 === 'u') {
      article2 = "an";
    }

    var connector = "is";
    switch (Math.floor(Math.random()*12)) {
      case 0:
        connector = "of";
      break;
      case 1:
        connector = "is";
      break;
      case 2:
        connector = "is";
      break;
      case 3:
        connector = "considers";
      break;
      case 4:
        connector = "is";
      break;
    }

    statement += article + " " + data[0].word + " " + city_con + " " + connector + " " + article2 + " " + data[1].word;
    //console.log("Sen "+ statement);
    callback(statement);

  }    
  ,"json");
  
};
//
//  making sentence for current color tweer
//
Bot.prototype.makeSentence_1 = function (news, callback) {
  var self = this;
  var statement = "";
  var adj = this.getAdjsURL;

  restclient.get(this.getNounsURL,
  function(data) {
    var noun_1 = data[0].word;
    var noun_2 = data[1].word;
  
    restclient.get(adj,
      function(data) {
         console.log('here1');
        var adj_1 = data[0].word;
        var adj_2 = data[1].word;


        //combine 
        wordpos.getAdjectives(news, function(result){
         
          wordpos.getNouns(news, function(result_1) {

            var i =  Math.floor(Math.random() * result.length);
            var i_ = Math.floor(Math.random() * result.length);
            while(i != i_)
              i_ = Math.floor(Math.random() * result.length);

            var j =  Math.floor(Math.random() * result_1.length);
            var j_ = Math.floor(Math.random() * result_1.length);
              while(j != j_)
              j_ = Math.floor(Math.random() * result_1.length);
            
            statement = news.replace(result[i],noun_1);
            statement = news.replace(result[i_],noun_2);
            statement = news.replace(result_1[j], adj_1);
            statement = news.replace(result_1[j_], adj_2);

            //console.log('stat  ' + news);
            //console.log('statN  ' + statement);
            callback(statement);

          });
        });
      }
     ,"json");
  }    
  ,"json");
  
};

//
//  getting trending hashtags
//
Bot.prototype.getHashtag = function (city, callback) {
  var self = this;
  
  //console.log(this.rite.command("directory ['color']"));// directory('color weather',function(reply) {
  
     // console.log(arr);
  // });
 // restclient.get(this.getNounsURL,
 // function(data) {
  
  //}    
  //,"json");
  
};

function randIndex (arr) {
  var index = Math.floor(arr.length*Math.random());
  return arr[index];
};
function remap (value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
};


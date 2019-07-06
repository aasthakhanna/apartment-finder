var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var exphbs = require('express-handlebars');
var _ = require('underscore');
var mongoose = require('mongoose');
var dotenv = require('dotenv');
var moment = require('moment');
var helpers = require('handlebars-helpers')();
var Apartment = require('./models/Apartment');
var app = express();
var jsdom = require('jsdom');
const {JSDOM} = jsdom;
const {window} = new JSDOM();
const {document} = (new JSDOM('')).window;
global.document = document;
var $ = jQuery = require('jquery')(window);

dotenv.load();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));

console.log(process.env.MONGODB)
mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    process.exit(1);
});

app.get("/addListing", function(req, res) {
   res.render('form');
});

app.get('/prices', function(req, res) {
  Apartment.find({}, function(err, apartments) {
      if (err) throw err;

      var sorted = _.sortBy(apartments, 'price');

      if (!(sorted instanceof Array)) {
        sorted = [sorted];
      }

      res.render('nav', {apt: sorted, header: 'Sorted by Price', price: true});
  });
});

app.get('/pricefilter', function(req, res) {
  Apartment.find({}, function(err, apartments) {
      if (err) throw err;

      var pre_found = _.pluck(apartments, 'price');
      var found = _.uniq(pre_found);
      found = _.sortBy(found);
      var min = found[0];
      var max = found.slice(-1)[0];
      var num_arr = [];

      var range = max - min;
      var iterate;

      if (range <= 1000) {
        iterate = 100;
      } else {
        iterate = 250;
      }

      for (i = Math.ceil(min/100)*100; i <= Math.ceil(max/100)*100; i += iterate) {
        num_arr.push(i);
      }

      res.render('prices', {prices: num_arr, header: 'Sorted by Price Range'});
  });
});

app.get('/price/:p', function(req, res) {
  Apartment.find({}, function(err, apartments) {
      if (err) throw err;

      var p = req.params.p;

      var found = _.filter(apartments, function(e) {return e.price <= p});

      if (!(found instanceof Array)) {
        found = [found];
      }

      res.render('nav', {apt: found, header: 'Listings Under ' + p});
  });
});

app.get('/random', function(req, res) {
  Apartment.find({}, function(err, apartments) {
      if (err) throw err;

      var found = _.shuffle(apartments)[0];

      if (!(found instanceof Array)) {
        found = [found];
      }

      res.render('nav', {apt: found, header: 'Random Listing', random: true});
  });
});

//add links for each feature
app.get('/features', function(req, res) {
  Apartment.find({}, function(err, apartments) {
      if (err) throw err;

      var found = _.sortBy(apartments, function(e) {return e.features.length});

      for (i = 0; i < found.length; i++) {
        if (found[i].features.length == 1 && $.inArray("", found[i].features) == 0) {
            found[i].features = [];
        }
      }

      var found = _.sortBy(apartments, function(e) {return e.features.length});

      if (!(found instanceof Array)) {
        found = [found];
      }

      res.render('nav', {apt: found, header: 'Sort by Number of Features', features: true});
  });
});

app.get('/date', function(req, res) {
  Apartment.find({}, function(err, apartments) {
      if (err) throw err;

      var found = _.sortBy(apartments, function(o) {return o.start_date});

      if (!(found instanceof Array)) {
        found = [found];
      }

      res.render('nav', {apt: found, header: 'Sorted by Date Available', date: true});
  });
});

app.get("/", function(req, res) {
  Apartment.find({}, function(err, apartments) {
      res.render('home', {apt: apartments});
  });
});

app.get("/:id", function(req, res) {
  Apartment.find({}, function(err, apartments) {
      if (err) throw err;

      var listing = _.filter(apartments, function(l) {
        if (l._id == req.params.id) {
          if (l.features.length == 1 && $.inArray("", l.features) == 0) {
            l.features = ['None']
          }
          return l;
        }
      });

      res.render('listing', {apt: listing});
  });
});

app.get("/api/getApartments", function(req, res) {
  Apartment.find({}, function(err, apartments) {
      if (err) throw err;
      res.send(apartments);
  });
});

function compareDate(date1, date2) {
  return new Date(date2) > new Date(date1);
}

 app.post('/api/addListing', function(req, res) {
  try {

     var feature_arr = req.body.features.split(",");

      var listing = new Apartment({
       title: req.body.title,
       first_name: req.body.first_name,
       last_name: req.body.last_name,
       email: req.body.email,
       location: req.body.location,
       start_date: req.body.start_date,
       end_date: req.body.end_date,
       price: parseInt(req.body.price),
       features: feature_arr
     });

      var isStartDateAfterNow = compareDate(new Date(), listing.start_date);
      var display = "";
      var error = false;

      var features_joined;

      if (typeof features != undefined) {
        features_joined = listing.features.join(" ");
      } else {
        features_joined = "None";
      }

      if (isStartDateAfterNow == false) {
        display += "Start date must be after today's date. ";
        error = true;
      }

      if (listing.price >= 5000) {
        display += "Price must be under $5000 a month. ";
        error = true;
      }

    if (listing.end_date != null) {
      var isDateAfter = compareDate(listing.start_date, listing.end_date);
      var isEndDateAfter = compareDate(new Date(), listing.end_date);

      if (!isDateAfter) {
        display += "End date must be after start date. ";
        error = true;
      }

      if (!isEndDateAfter) {
        display += "End date must be after today's date. ";
        error = true;
      }
    }

    if (error) {
      return res.render('success', {err: true, display: display});
    }

     listing.save(function(err) {
         if (err) throw err;
         res.render('success', {err: false});
     });
  } catch (error) {
    res.render('success', {err: true, display: error});
  }
 });

app.listen(3000, function() {
    console.log('Apartment Search listening on port 3000!');
});

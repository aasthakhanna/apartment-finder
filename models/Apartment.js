var mongoose = require('mongoose');

var apartmentSchema = new mongoose.Schema({
    title: {
       type: String,
       required: true
     },
     first_name: {
       type: String,
       required: true
     },
     last_name: {
       type: String,
       required: true
     },
     email: {
       type: String,
       required: true
     },
     location: {
       type: String,
       required: true
     },
     start_date: {
       type: Date,
       required: true
     },
     end_date: {
       type: Date,
       required: false
     },
     price: {
       type: Number,
       required: true
     },
     features: {
       type: [String],
       required: false
     }
  });

var Apartment = mongoose.model('Apartment', apartmentSchema);

module.exports = Apartment;

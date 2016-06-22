var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var places = new Schema({
    id:{type:Number,index:1,required:true,unigue:true},
    name:{type:String,required:true},
    type:{type:String,required:true},
    status:{type:String,required:true},
    width:{type:Number,required:true},
    height:{type:Number,required:true},
    coord_x:{type:Number,required:true},
    coord_y:{type:Number,required:true},
    comments:{type:Array,required:false},
    neighbors: [{
        Id:String,
        weight:Number
        }]
},{collection:'places'});

var placesSchema = mongoose.model('places', places);
module.exports  = placesSchema;
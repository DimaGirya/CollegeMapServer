const Graph = require('node-dijkstra');
var mongoose = require('mongoose');
var placesSchema = require('./placesSchema');
var DB = require('./database');

// get all places
exports.getMap = function(req,res) {
    var status = 200;
    if(!DB.isConnectedToDB()){
        res.status(status).send({"message":"No connection to data base.Try again leter"});
    }
    placesSchema.find({},function (err,data) {
        if(err){
            throw err;
        }
        res.status(status).send(data)
    });
};

exports.getMapToDisplay = function(req,res) {
    var status = 200;
    if(!DB.isConnectedToDB()){
        res.status(status).send({"message":"No connection to data base.Try again leter"});
    }
    placesSchema.find({},function (err,data) {
        if(err){
            throw err;
        }
        var result = calculateMap(data);
        res.status(status).send(result)
    });

};

function calculateMap(places) {
    console.log(places);
    var map = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [],[],[],[]];
    var numberOfRows = places.length;
    for (var i = 0; i < numberOfRows; i++) {
        var place = places[i];
        var coordY = place.coord_y;
        var coordX = place.coord_x;
        var roomHeight = coordY + place.height;
        for (var j = coordY; j < roomHeight; j++) {
            var roomWidth = coordX + place.width;
            console.log( map[j]);
            for (var k = coordX; k < roomWidth; k++) {
                 map[j][k] = {type: place.type, border: "border", status: place.status, place_id: place.id, in_path: false,
                 coord_x:j,coord_y:k};
            }
            console.log( map[j]);
        }
    }
    calculateMapsBorders(map);
    return JSON.stringify(map)
}

function calculateMapsBorders(map) {
    var mapLength =  map.length;
    for(var y = 0; y <mapLength; y++) {
        var current_row = map[y];
        var currentRowLength  = current_row.length;
        for(var x = 0; x < currentRowLength; x++) {

            console.log("y:");
            console.log(y);
            console.log("x:");
            console.log(x);
            try {
                if(map[y][x].type == "hallway"){
                    continue;
                }
                if (map[y - 1] === undefined) {
                    map[y][x].border += "Top";
                }
                else if (map[y][x].place_id !== map[y - 1][x].place_id) {
                    map[y][x].border += "Top"
                }

                if (map[y][x + 1] === undefined) {
                    map[y][x].border += "Right";
                }
                else if (map[y][x].place_id !== map[y][x + 1].place_id) {
                    map[y][x].border += "Right"
                }

                if (map[y + 1][x] === undefined) {
                    map[y][x].border += "Bottom";
                }
                else if (map[y][x].place_id !== map[y + 1][x].place_id) {
                    map[y][x].border += "Bottom"
                }

                if (map[y][x - 1] === undefined) {
                    map[y][x].border += "Left";
                }
                else if (map[y][x].place_id !== map[y][x - 1].place_id) {
                    map[y][x].border += "Left"
                }

            console.log(map[y][x].border);
            console.log("place ID");
            console.log(map[y][x].place_id);
        }
            catch(e){
                console.log(e);
            }
        }
    }
}

// get id's of places of the shortest path and cost
exports.getPath = function(req,res) { //todo validation
    var from = req.params.from;
    var to = req.params.to;
    console.log("from:"+from);
    console.log("to:"+to);
    var status = 200;
    placesSchema.find({},function (err,data) {
        if(err){
            throw err;
        }
       // console.log(data);
        var temp  = JSON.stringify(data);
        var places = JSON.parse(temp);
        var route = getGraph(places);
        var message = route.path(from,to,{cost:true});
        res.status(status).send(message)
    });
};

exports.setStatusRoom = function(req,res) {
    var status = 200;
    var roomId = req.params.room; //id of room
    var roomStatus = req.params.status; //status string
    var response;
    var query = placesSchema.findOne().where({id:roomId});
    query.exec(function (err,doc) {
        if(err) {
            console.log(err);
            throw err;
        }
        if(doc.type != 'class'){
            response =  [{"message":"Room is not class. Can't change status of room"}];
            res.status(status).send(response);
        }
        else if(doc.status == roomStatus){
            response =  [{"message":"Same status"}];
            res.status(status).send(response);
        }
        else{
            var query = doc.update({
                $set:{'status':roomStatus}
            });
            query.exec(function (err,results) {
                if(err)throw err;
                response =  [{"message":"Save status done"}];
                res.status(status).send(response);
            });
        }
    });
};

exports.getRoomStatus = function(req,res) { 
    placesSchema.find({},function (err,data) {
        if(err){
            throw err;
        }
        var room_status;
        res.status(200).send(room_status)
    });
};

function getGraph(places) {
    var graph = new Graph();
    var sizeArray = places.length;
    //console.log(places);
    for (var i = 0; i < sizeArray; i++) {
        var sizeNeighbors = places[i].neighbors.length;
        var neighbors = places[i].neighbors;
        var cost = 0;
        var neighbor = null;
        var temp = {};
        for (var j = 0; j < sizeNeighbors; j++) {
            neighbor = parseInt(neighbors[j].Id);
            cost = parseInt(neighbors[j].weight);
            temp[neighbor] = cost;
        }
        graph.addNode(places[i].id.toString(), temp);
    }
    console.log(graph);
    return graph;
}
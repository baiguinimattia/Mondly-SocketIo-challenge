var middlewareObj = {};
var Socket = require("../models/socket");
var Room = require("../models/room");
var Exercise = require("../models/exercise");
middlewareObj.pickGames = function pickGames(numberOfGames, callback){
    let games = [];
    let gameIds = new Array(15).fill(0);
    
    let i = 0 ;
    getExercises(function(foundExercises){
        while( i < numberOfGames){
            getRandomInt(15 , function(number){
                if(gameIds[number] === 0){
                    games.push(foundExercises[number]);
                    gameIds[number] = 1;
                    i++;
                };
            });
        };
        if(i >= numberOfGames){
            callback(games);
        };
    });


};

middlewareObj.getExercises = function getExercises(callback){
    Exercise.find({} , function(err , foundExercises){
        if(err){
            console.log(err);
        }
        else{
            if(foundExercises.length > 0 ){
                callback(foundExercises);
            };
        };
    });
};

middlewareObj.checkIfAlreadyPicked = function checkIfAlreadyPicked(id , array , callback){
    for(let i = 0 ; i < array.length ; i++){
        if(array[i] === id){
            callback(true);
        };
    };
    callback(false);
};

middlewareObj.getRandomInt = function getRandomInt(max , callback) {
    callback(Math.floor(Math.random() * Math.floor(max)));
}

middlewareObj.checkForDuplicatedSockets = function checkForDuplicatedSockets(socket){
    let numberOf = 0;
    let previousPosition = -1;
    findSockets(function(foundSockets){
        for(let i = 0 ; i < foundSockets.length ; i++){

            if(socket.username === foundSockets[i].username){
                numberOf++;
                if(numberOf > 1){
                    removeSocket(foundSockets[previousPosition]);
                    numberOf--;                    
                }
                previousPosition = i;
            };
        };
    });
};



function clearDatabase(){
    Socket.deleteMany({} , function(err){
        if(err) console.log(err);
    });
    Room.deleteMany({} , function(err){
        if(err) console.log(err);
    })
};


function removeSocketFromRoom(socket , room){
    for(let i = 0 ; i < room.sockets.length ; i++){
        if(room.sockets[i].socketId === socket.socketId){
            room.sockets.splice(i , 1);
            Room.findByIdAndUpdate(room._id , room , function(err , updatedRoom){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("socket removed from room");
                };
            });
        };
    };
};

function removeEmptyRooms(){
    findRooms(function(foundRooms){
        foundRooms.forEach(function(room){
            if(!room.sockets.length){
                removeRoom(room);
            };
        });
    });

};

function findSockets(callback){
    Socket.find({} , function(err , foundSockets){
        if(err){
            console.log(err);
        }
        else{
            console.log("din findSockets")
            callback(foundSockets);
        }
    });
};


function newSocket(socket , data , callback){
    let newSocket = {};
    newSocket.socketId = socket.id;
    newSocket.username = data.username;
    Socket.create(newSocket,function( error, newSocket){
        if(error){
                console.log(error);
        }
        else{
                console.log("Socket succesfully created");
                callback(newSocket);
        }
    });
};

function createNewRoom(data){
    let newRoom = {};
    newRoom.name = data.name;
    newRoom.roomNo = data.roomNo;
    newRoom.sockets = data.sockets;
    Room.create(newRoom,function( error, newRoom){
        if(error){
                console.log(error);
        }
        else{
            console.log("Room succesfully created");
        }
    });
};

function findSocketById(socket , callback){
    Socket.find({socketId : socket.id} , function(err , foundSocket){
        if(err){
            console.log(err);
        }
        else{
            if(foundSocket.length){
                callback(foundSocket[0]);
            };
        };
    });
};

function findSocketByUsername(username , callback){
    Socket.find({username : username} , function(err , foundSocket){
        if(err){
            console.log(err);
        }
        else{
            if(foundSocket.length){
                callback(foundSocket[0]);
            };
        };
    });
};

function findRooms(callback){
    Room.find({} , function(err , foundRooms){
        if(err){
            console.log(err);
        }
        else{
            callback(foundRooms);
        };
    });
};

function getNumberOfRooms(callback){
    Room.find({} , function(err , foundRooms){
        if(err){
            console.log(err);
        }
        else{
            callback(foundRooms.length);
        };
    });
};

function findRoomByNo(roomNo , callback){
    Room.find({ roomNo : roomNo} , function(err , foundRooms){
        if(err){
            console.log(err);
            // console.log("vine eroare din findRoomByNo");
        }
        else{
            if(foundRooms.length){
                callback(foundRooms[0]); 
            };
        };
    });
};

function updateSocket(socket){
    Socket.findByIdAndUpdate(socket._id , socket , function(err , updatedSocket){
            if(err){
                console.log(err);
            }
            else{
                console.log("Socket succesfully updated");
            }
    });

};

function updateRoom(room){
    Room.findByIdAndUpdate(room._id , room , function(err , updatedRoom){
        if(err){
            console.log(err);
        }
        else{
            console.log("Room succesfully updated");
        }
    });
};

function removeRoom(room){
            Room.findByIdAndRemove(room._id , function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Room succesfully removed");
                }
            });
};

function removeSocket(socket){
        Socket.findByIdAndRemove(socket._id , function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log("Socket succesfully removed");
            }
        });
};

module.exports = middlewareObj;
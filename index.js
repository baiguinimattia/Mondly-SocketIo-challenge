let express = require("express");
let app     = express();

let bodyParser = require("body-parser"),
mongoose   = require("mongoose"),
passport   = require("passport"),
localStrategy = require("passport-local"),
flash      = require("connect-flash");

let http = require("http").Server(app);
let io = require("socket.io")(http);

app.use(express.static("public"));
app.set("view engine" , "ejs");



let Exercise = require("./models/exercise");
let User = require("./models/user");
let Room = require("./models/room");
let Socket = require("./models/socket");
let Country = require("./models/country");
let middleware = require("./middleware/index");
let userRoutes = require("./routes/index");

mongoose.connect("mongodb://localhost:27017/challengeMondly" , {useNewUrlParser : true});

app.use(bodyParser.urlencoded({ extended : true}));
app.use(bodyParser.json());

app.use(flash());

app.use(require("express-session")({
    secret: "This is ok",
    resave : false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req , res , next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

let Translate = require("@google-cloud/translate");
let projectId = "formidable-bank-214408";

let translate = new Translate({
    projectId : projectId
});

function translateText(text , target , callback){
    translate
    .translate(text , target)
    .then(results=>{
        const translation = results[0];
        console.log(translation);
        callback(translation); 
    })
    .catch(err => {
        // console.log("Error:" , err);
        console.log("we have an error " + err.message);
    });
};

app.get("/" , function(req , res){
    res.render("main");
})

app.get("/main" , function(req , res){
    res.render("main");
})

app.get("/test" , function(req , res){
    res.render("test");
})

app.get("/leaderboards" , function(req , res){
    res.render("leaderboards");
});

app.get("/countries" , function(req , res){
    getCountries(function(arrayCountries){
        res.send(arrayCountries);
    });

});

app.get("/adding" , middleware.isLoggedIn , function(req , res){
    res.render("adding");
});

app.post("/exercise/add" , function(req , res){
    addExercise(req.body.exercise);
});

function addExercise(data){
    let newExercise = {};
    newExercise.statement = data.statement;
    newExercise.response = data.response;

    newExercise.variants = [];
    if(data.variantOne){
        newExercise.variants.push(data.variantOne);
    };
    if(data.variantTwo){
        newExercise.variants.push(data.variantTwo);
    };
    if(data.variantThree){
        newExercise.variants.push(data.variantThree);
    };
    if(data.variantFor){
        newExercise.variants.push(data.variantFor);
    };
    if(data.extra){
        newExercise.extra = data.extra;
    };
    Exercise.create(newExercise,function( error, newExercise){
        if(error){
                console.log(error);
        }
        else{
                console.log("Exercise created");
        }
    });
};

function getCountries(callback){
    let arrayCountries = new Array();
    Country.find({} , function(err , foundCountries){
        if(err){
            console.log(err);
        }
        else{
            for(let i=0 ; i < foundCountries.length ; i++){
                    arrayCountries.push({title : foundCountries[i].name , code : foundCountries[i].tag});
            };
            callback(arrayCountries);
        };
    });
};

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

app.use(userRoutes);

app.get("/chat" , middleware.isLoggedIn, function(req , res){
    res.render("chat" , {currentUser : req.user});
});

app.get("/rooms" , function(req , res){
    res.send({arrayLobbies : lobbies});
});

app.get("/lobby" , function(req , res){
    res.render("lobby");
});


let maximumCapacity = 3;

//this function deletes everything from the database on each run
clearDatabase();

io.on("connection" , function(socket){
    socket.on("new user" , function(data){
        newSocket(socket , data , function(createdSocket){
            console.log("intra in check for duplicated" , data.username);
            checkForDuplicatedSockets(createdSocket);
        });
    });

    socket.on("new room" , function(data){
        findSocketById(socket , function(foundSocket){
            getNumberOfRooms(function(numberOfRooms){
                let newRoom = {};
                newRoom.roomNo = numberOfRooms + 1;
                newRoom.sockets = [];
                newRoom.sockets.push(foundSocket);
                createNewRoom(newRoom);
                foundSocket.roomNo = newRoom.roomNo;
                updateSocket(foundSocket);
                socket.join("room-"+ newRoom.roomNo);
                io.to(foundSocket.socketId).emit("joined empty room" , { message : "You joined room " + newRoom.roomNo + ", which is empty!"});
            })
        });

    });

    socket.on("pressed ready" , function(){
        findSocketById(socket , function(foundSocket){
            findRoomByNo(foundSocket.roomNo , function(foundRoom){
                foundRoom.pressedReady += 1;
                updateRoom(foundRoom);
                if(foundRoom.pressedReady === foundRoom.sockets.length){
                    io.in("room-" + foundRoom.roomNo).emit("start countdown" , {message : "The game is about to start"});
                }
                else{
                    io.in("room-" + foundRoom.roomNo).emit("not enough players", {message : "There are not enough ready players"});
                }
            });
        });
    });

    
    socket.on("pressed unready" , function(){
        findSocketById(socket , function(foundSocket){
            findRoomByNo(foundSocket.roomNo , function(foundRoom){
                foundRoom.pressedReady -= 1;
                updateRoom(foundRoom);
                io.in("room-" + foundRoom.roomNo).emit("not enough players", {message : "There are not enough ready players"});
            });
        });
    });

    // socket.on("check if able to start" , function(data){
    //     findSocketById(socket , function(foundSocket){
    //         findRoomByNo(foundSocket.roomNo , function(foundRoom){
    //             if(foundRoom.sockets.length > 1 && foundRoom){
    //                 // io.in("room-" + roomNo).emit('big-announcement', 'the game will start soon');
    //             };
    //         });
    //     });
    // });

    socket.on("join specific room" , function(data){
        findSocketByUsername(data.username , function(foundSocket){
            let roomNo = data.lobby;
            findRoomByNo(roomNo , function(foundRoom){
                foundSocket.hasLeft = false;
                if(foundRoom.sockets.length > maximumCapacity){
                    io.to(user.socketId).emit('unable to join room', "Please choose another room");
                }
                else{
                    foundSocket.roomNo = roomNo;
                    foundRoom.sockets.push(foundSocket);
                    updateRoom(foundRoom);
                    updateSocket(foundSocket);
                    socket.join("room-"+ roomNo);
                    socket.to("room-" + roomNo).emit("new user joined", "User " + foundSocket.username + " joined this room");
                    io.to(foundSocket.socketId).emit("joined specific room" , { message : "You joined room " + roomNo});
                };
            })

        });  
    }); 

    socket.on("picked languages by user" , function(data){
        findSocketById(socket ,function(foundSocket){
            foundSocket.nativeLanguage = data.native;
            foundSocket.learningLanguage = data.learning;
            updateSocket(foundSocket);
        });

    });

    socket.on("new message" , function(data){
      findSocketById(socket , function(foundSocket){
        io.sockets.in("room-"+foundSocket.roomNo).emit("message to room" , { username : foundSocket.username , text : data.message , nativeLanguage : foundSocket.nativeLanguage}); 
      });      
    });

    socket.on("request translation" , function(data){
        findSocketById(socket , function(foundSocket){
            Country.find({ name : foundSocket.nativeLanguage} , function(error , foundCountries){
                if(error){
                    console.log(error);
                }
                else{
                    if(foundCountries.length > 0 ){
                        translateText(data.message , foundCountries[0].tag  , function(translation){
                            io.to(foundSocket.socketId).emit("sending back translation", {translation : translation , from : data.from});
                        });
                    };
                };
            });
        });

    });  
    socket.on("send lobbies list" , function(data){
        findSocketById(socket , function(foundSocket){
            findRooms(function(foundRooms){
                io.emit('sending lobbies' , {lobbies : foundRooms , username : foundSocket.username});
            });
        });
    });
    socket.on("pressed Leave" , function(data){
        findSocketById(socket , function(foundSocket){
            let url = "/";
            console.log(foundSocket.username + "has left room no " + foundSocket.roomNo);
            console.log("redirect to " , url , " after he left the room no " , foundSocket.roomNo);
            io.sockets.in("room-"+foundSocket.roomNo).emit("leftRoom" , { description : foundSocket.username + " has left this lobby!"});
            findRoomByNo(foundSocket.roomNo , function(foundRoom){
                removeSocketFromRoom(socket , foundRoom);
                socket.leave("room-" + foundRoom.roomNo);
                removeEmptyRooms();
                io.to(foundSocket.socketId).emit("redirect" , { url : url} );
            })
            foundSocket.roomNo = -1;
            updateSocket(foundSocket);
        });
    });

    socket.on("disconnect" , function(){
        findSocketById(socket , function(foundSocket){
            if(foundSocket.hasLeft === false){
                io.sockets.in("room-"+foundSocket.roomNo).emit("disconnected" , { description : foundSocket.username + " has disconnected from this lobby"});
            };
            removeSocket(foundSocket);
            findRoomByNo(foundSocket.roomNo , function(foundRoom){
                removeSocketFromRoom(foundSocket.roomNo , foundRoom);
            });
            removeEmptyRooms();
        });
    });    
});

function checkForDuplicatedSockets(socket){
    let numberOf = 0;
    let previousPosition = -1;
    findSockets(function(foundSockets){
        for(let i = 0 ; i < foundSockets.length ; i++){

            if(socket.username === foundSockets[i].username){
                numberOf++;
                if(numberOf > 1){
                    console.log("vine socket" , socket.username , "vine foundsockets[i]" , foundSockets[i].username);
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
        if(room.sockets[i].socketId === socket.id){
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
                removeRoom(room.roomNo);
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
            console.log("din findSockets" , foundSockets)
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
            console.log("Room succesfully updated" , updatedRoom);
        }
    });
    // findRoomByNo(room.roomNo , function(foundRoom){
    //     let data = {};
    //     data.name = room.name;
    //     data.roomNo = room.roomNo;
    //     data.sockets = [];
    //     data.sockets = room.sockets;
    //     data.pressedReady = room.pressedReady;
    //     delete foundRoom["_id"];
    //     Socket.updateOne({ roomNo : room.roomNo} , data , function(err , updatedRoom){
    //         if(err){
    //             console.log(err);
    //         }
    //         else{
    //             console.log("Room succesfully updated" , updatedRoom);
    //         }
    //     })
    // });

};

function removeRoom(roomNo){
    findRoomByNo(roomNo , function(foundRoom){
        if(!foundRoom.sockets.length){
            Room.findByIdAndRemove(foundRoom._id , function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Room succesfully removed");
                }
            });
        };
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


app.get("/*" , function(req , res){
    res.send("<h1>Error 404! Page not found!</h1>");
});


http.listen(3000 , function(){
    console.log("Connection to server established");
});
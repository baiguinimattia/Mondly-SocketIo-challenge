$(function () {
    var socket = io({"connect timeout" : 10000 , "reconnect" : true , "reconnection delay" : 200 , "max reconnection attempts" : 5});

    let username = $("strong#username").text().toLowerCase();

    socket.emit("new user" , { username : username});

    $(".send").click(function(event){
        let message = $("#message").val();
        socket.emit("new message" , { username : username , message : message});
    });

    socket.on("message to room" , function(data){
        socket.emit("request translation" , {message : data.text , from : data.username , username : username});
    });

    socket.on("message to self" , function(data){
        appendText("#messages" , "<li>" + data.from + ": " + data.message + "</li>");
    });

    socket.on("sending back translation" , function(data){
        appendText("#messages" , "<li>" + data.from + ": " + data.translation + "</li>");
    });

    getCountries(function(data){  
        for(let i=0; i< data.length ; i++){
            let stringToAppend = "";
            stringToAppend += "<option value='"+i+"'>" + data[i].title +"</option>";
            $(".ui.dropdown").append(stringToAppend);
        };
        $(".btn.btn-danger.send").click(function(){
            let textToTranslate = $("#message").val();
            $("#message").val("");
            let dropdown = $(".ui.dropdown");
            let target = dropdown[0].value;
            let url = "/translate";
        
            $.post(url , { text : textToTranslate , target : data[target].title} , function( data ){
                socket.emit("new message" , { username : username , message : data});
            });
        });
    
    });

    $(".btn.btn-danger.random").click(function(event){
        socket.emit("assign random room" , {username : username});
    });

    socket.on("need new room" , function(data){
        socket.emit("new room" , {username : username});
        $(".row.chat").removeClass("hidden");
        $(".btn.btn-danger.new-room").addClass("hidden");
        $(".container.rooms").addClass("hidden");
    });

    socket.on("need specific room" , function(data){
        socket.emit("join specific room" , { username : username , lobby : data.room});
        $(".row.chat").removeClass("hidden");
        $(".container.rooms").addClass("hidden");
        $(".btn.btn-danger.new-room").addClass("hidden");
    });

    socket.on("joined empty room" , function(data){
        appendText("#messages" , "<li>" + data.message + "</li>");
    });



    $(".btn.btn-secondary.language").click(function(event){
        let dropdownNative = $(".dropdown.native");
        let nativeLanguage = dropdownNative[0][Number(dropdownNative[0].value) + 1].text;
        
        let dropdownLearn = $(".dropdown.learn");
        let learnLanguage = dropdownLearn[0][Number(dropdownLearn[0].value) + 1].text;
        console.log("picked languages" , nativeLanguage , learnLanguage);
        socket.emit("picked languages by user" , {username : username , native : nativeLanguage , learning : learnLanguage});
        
        socket.emit("send lobbies list" , {username : username});

        socket.on("sending lobbies" , function(data){
            if(data.username === username){
                    console.log(data);
                    data.lobbies.forEach(function(room){
                        if(3 - room.connectedUsers.length){
                            $("#rooms").append("<li>" + "Room " + room.id  + "</li><button data-type-id=" + room.id + " class='btn btn-danger lobby'>Join room</button>");
                        }
                        else{
                            $("#rooms").append("<li>" + "Room " + room.id  + "</li>");
                        };
                        $(".btn.btn-danger.lobby").click(function(event){
                            let room = $(".btn.btn-danger.lobby").attr("data-type-id");
                            socket.emit("join specific room" , { username : username , lobby : room});
                            $(".row.chat").removeClass("hidden");
                            $(".container.rooms").addClass("hidden");
                            $(".btn.btn-danger.new-room").addClass("hidden");
                        });
                        
                });
            };



        });
        
        $(".container.rooms").removeClass("hidden");

    $(".btn.btn-danger.new-room").click(function(event){
        socket.emit("new room" , {username : username});
        $(".row.chat").removeClass("hidden");
        $(".btn.btn-danger.new-room").addClass("hidden");
        $(".container.rooms").addClass("hidden");
    });

    socket.on("new user joined" , function(data){
        appendText("#messages" , "<li>" + data + "</li>");
    });

    socket.on("reset" , function(data){
        $(".container.language").removeClass("hidden");
        $(".row.chat").addClass("hidden");
        $(".btn.btn-danger.new-room").removeClass("hidden");
    });

    socket.on("joined specific room" , function(data){
        appendText("#messages" , "<li>" + data.message + "</li>");
    });

    $(".leave").click(function(){
        socket.emit("pressed Leave" , {username : username});
    });

    socket.on("redirect" , function(data){
        window.location = "http://localhost:3000" + data.url;
    });

    socket.on("leftRoom" , function(data){
        $("#messages").append("<li>" + data.description + "</li>");
    });
    socket.on("disconnected" , function(data){
        console.log(data);
        $("#messages").append("<li>" + data.description + "</li>");
    });

    socket.on("send connected users" , function(data){
        console.log(data);
    });
});


$("#submitName").click(function(event){
    let username = $("#pickedName").val();
    console.log(username);
});

function appendText(to , text){
    $(to).append(text);
};


function getCountries(callback){
    let url = "/countries";
    $.get(url)
    .done(function(data){
        callback(data);
    });
    
};

    function getRoomsList(callback){
        let url = "/rooms";
        $.get(url)
        .done(function(data){
                console.log(data);
                data.arrayLobbies.forEach(function(room){
                    if(3 - room.connectedUsers.length){
                        $("#rooms").append("<li>" + "Room " + room.id  + "</li><button data-type-id=" + room.id + " class='btn btn-danger lobby'>Join room</button>");
                    }
                    else{
                        $("#rooms").append("<li>" + "Room " + room.id  + "</li>");
                    };

                });
                callback();
        });
    };
})

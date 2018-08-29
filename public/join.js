function getRoomsList(){
    let url = "/rooms";
    $.get(url)
    .done(function(data){
            data.arrayLobbies.forEach(function(room){
                if(3 - room.connectedUsers.length){
                    $("#rooms").append("<li>" + "Room " + room.id + " Available spots " + (3 - room.connectedUsers.length) + "</li><button class='btn btn danger'>Join room</button>");
                }
                else{
                    $("#rooms").append("<li>" + "Room " + room.id + " Available spots " + (3 - room.connectedUsers.length) + "</li>");
                };

            });
    });
};

getRoomsList();
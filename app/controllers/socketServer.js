const users = [];
let currentPlayers = [];
function randomRoom(){
    let id = '';
    let length = 12;
    let randomChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(counter = 0; counter < length; counter++){
        id += randomChar.charAt(Math.floor(Math.random() * randomChar.length));
    }
    return id;
}

exports = module.exports = function(io){
    io.on('connection', (socket) => {
        socket.on("submitName", function(nick) {
            socket.nick = nick;
            let room = randomRoom();
            users.push({
                id: socket.id,
                name: nick,
                room: room
            });
           socket.join(room);
           io.emit("roomDetail", {
                users: users,
            });
        });

        socket.emit('existingUsers', {
            users:users,
            currentUserId: socket.id
        });
        socket.on('sendJoinRequest', (requestData) => {
        	if(requestData.id==socket.id) {
				 socket.emit("warning", {
                	warning: "Please choose another player"
            	});
        	} else {
        		let user = getCurrentUser(users,socket);
                socket.broadcast.to(requestData.room).emit('status', {
                status: 'Recieved a game request from <strong>'+user.name+'</strong>. <button data-room="'+user.room+'" class="btn btn-primary btn-sm acceptGameRequest">Accept</button>'
            });
                socket.emit("status", {
                	status: "Game invitation successfully sent"
            	});
        	}
        });
        socket.on('acceptGameRequest', (requestData) => {
            let user = getCurrentUser(users,socket);
            currentPlayers = [];
            currentPlayers.push(user);
            socket.emit('currentGame', {
                users:currentPlayers
            });
            socket.broadcast.to(requestData.room).emit('gameRequestAccepted', {
                id: user.id,
                name: user.name,
                room: user.room, 
            });
           removeUser(users,socket);
            socket.broadcast.to(requestData.room).emit('currentGame', {
                users:currentPlayers
            });
        });


        socket.on('chatMessage', (requestData) => {
            let user = getCurrentUser(users,socket);
            if (!user) {
                user = getCurrentUser(currentPlayers,socket)
            }
            console.log(user);
           io.emit("chatMsg", {
                user: user,
                msg: requestData.msg
            });

        });
        socket.on('chatMessageD', (requestData) => {
            let user = getCurrentUser(currentPlayers,socket);
           socket.emit("chatMsgD", {
                user: user,
                msg: requestData.msg
            });
            socket.broadcast.to(requestData.room).emit('chatMsgD', {
                user: user,
                msg: requestData.msg,
                room: requestData.room
            });

        });


        socket.on('setOrientation', (requestData) => {
            let user = getCurrentUser(users,socket);
            removeUser(users,socket);
            currentPlayers.push(user);

            socket.broadcast.to(requestData.room).emit('currentGame', {
                users:currentPlayers
            });
            socket.emit('setOrientation', {
                id: user.id,
                users:currentPlayers
            });
            socket.broadcast.to(requestData.room).emit('setOrientationOppnt', {
                users:currentPlayers,
                currentUserId: socket.id,
                color: requestData.color,
                id: user.id,
                name: user.name,
                room: user.room,
            });

    
           io.emit("roomDetail", {
                users: users,
            });

        });
        socket.on('chessMove', (requestData) => {
            let color = requestData.color,
                from = requestData.from,
                to = requestData.to,
                piece = requestData.piece,
                promo = requestData.promo||'';
                console.log(promo);
            socket.broadcast.to(requestData.room).emit('oppntChessMove',{
                color,from,to,piece,promo
            });

        });
        socket.on('gameWon', (requestData) => {
            socket.broadcast.to(requestData.room).emit('oppntWon');
        });
        socket.on('disconnect', () => {
             removeUser(users,socket);
            if(socket.nick) {
            	io.emit("status", {
                users: users,
                status: socket.nick + " opuścił grę."
            });
             io.emit("roomDetail", {
                users: users,
            });
            }

        });
    });


    function removeUser(u,s) {
        for(i = 0; i< u.length; i++){
            if(u[i].id == s.id){
               u.splice(i,1);
                break;
            }
        }    
    }
    function getCurrentUser(u,s) {
        return u.filter(user=>user.id == s.id)[0] 
    }
}

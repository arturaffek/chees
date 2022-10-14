(function(){

    var joinForm = $("#join-form"),
    joined = false,
    chatForm = $("#chat-form"),
    pForm = $(".players-cont"),
    nick = $("#nick"),
    players = $('#players'),
    currentPlayers = $('#currentGame'),
    nickgreet = $('#userName'),
    chatWindow = $('#chat-window'),
    chatWindowD = $('#chat-windowD'),
    info = $(".info"),
    chatMessageTpl = Handlebars.compile( $("#chat-message-template").html() );

    joinForm.on("submit", function(e) {
        e.preventDefault();
        var nickName = $.trim( nick.val() );

        if(nickName === "") {
        	nick.addClass("invalid");
        } else {
            nick.removeClass("invalid");
            socket.emit("submitName", nickName);
            nickgreet.html('<div class="h3"><h2>Hi '+nickName+'</h2></div>');
            joinForm.hide();
            chatForm.show();
            pForm.show();
            joined = true;
        }
    });


    socket.on('roomDetail', (roomData) => {
        players.html('');
        roomData.users.forEach(user => {
        players          
            .append($('<li class="list-group-item" id="'+user.id+'">')
            .html('<button type="button" data-room="'+user.room+'" class="btn btn-primary btn-sm joinGameRequest">'+user.name+'</button>'));

        });

    });

    socket.on('existingUsers', (userData) => {
        userData.users.forEach(user => {
                players
                .append($('<li class="list-group-item" id="'+user.id+'">')
                .html('<button type="button" data-room="'+user.room+'" class="btn btn-primary btn-sm joinGameRequest">'+user.name+'</button>'));
        });
    });

      socket.on('currentGame', (userData) => {
        currentPlayers.html('');
       
        userData.users.forEach(user => {
                currentPlayers
                .append($('<li class="list-group-item" id="'+user.id+'">')
                .html('<button type="button" data-room="'+user.room+'" class="btn btn-primary btn-sm joinGameRequest">'+user.name+'</button>'));
        });
         $('#cGame').addClass('active');
    });  



    socket.on("status", function(data){
        var html = '<div class="alert alert-success">'+data.status+'</div>';
        info.html(html);
    })
    socket.on("warning", function(data){
        var html = '<div class="alert alert-warning">'+data.warning+'</div>';
        info.html(html);
    })
    
    socket.on('joinRequestRecieved', (userData) => {
        info.html('<div class="alert alert-success">Recieved a game request from <strong>'+userData.name+'</strong>. <button data-room="'+userData.room+'" class="btn btn-primary btn-sm acceptGameRequest">Accept</button></div>')
    });

    $(document).on('click', '.joinGameRequest', function(){
        socket.emit('sendJoinRequest', {
            room: $(this).data('room'),
            id: this.parentNode.id
        });
    });
    $(document).on('click', '.acceptGameRequest', function(){
        socket.emit('acceptGameRequest', {
            room: $(this).data('room')
        });
        info.html('<div class="alert alert-success">Please wait for game initialize from host.</div>');
    });

    socket.on('gameRequestAccepted', (userData) => {
        info.append($('<div class="text-center">Choose rotation. <button data-room="'+userData.room+'" data-color="black" type="button" class="btn btn-primary btn-sm setOrientation">Black</button> or <button data-room="'+userData.room+'" data-color="white" type="button" class="btn btn-primary btn-sm setOrientation">White</button></div>'));
            $('#currentGame li#'+userData.id).addClass('active'); 

    });


    socket.on('chatMsg', (data) => {
        var html = chatMessageTpl({
            nick: data.user.name,
            message: data.msg
        });

        chatWindow.append(html);
    });

    socket.on('chatMsgD', (data) => {
        var html = chatMessageTpl({
            nick: data.user.name,
            message: data.msg
        });

        chatWindowD.append(html);
    });

    socket.on('setOrientation', (userData) => {
        currentPlayers.html('');
         
        userData.users.forEach(user => {
                currentPlayers
                .append($('<li class="list-group-item" id="'+user.id+'">')
                .html('<button type="button" data-room="'+user.room+'" class="btn btn-primary btn-sm joinGameRequest">'+user.name+'</button>'));
        });
         $("#currentGame li").each(function() {
          if($(this).attr('id')!=userData.id) {
            $(this).addClass('active');
          }
        });
         $('#cGame').addClass('active');
         $('#directChat').addClass('active'); 
    });

    socket.on('setOrientationOppnt', (data) => { 
  $('#currentGame li#'+data.id).addClass('active');
  $('#directChat').addClass('active'); 
        playerColor = data.color;
        board.orientation(playerColor);
        board.start();
        if(data.color == 'white'){  
        info
        .html('<div class="alert alert-success">Game is initialized by <strong>'+data.name+'</strong>. Let\'s start with First Move.</div>');
        } else{
        info
        .html('<div class="alert alert-success">Game is initialized by <strong>'+data.name+'</strong>. Wait for White Move.</div>');
        }
        
    });
    socket.on('opponentDisconnect',function(){
        info.html('<div class="alert alert-success">Opponent left the room</div>');
        board.reset();
        chess.reset();
    })

}());
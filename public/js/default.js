var board = null,
    info = $(".info"),
    chatMessage = $("#message"),
    chatMessageD = $("#messageD"),
    playerColor ='white',
    chess = new Chess();

const boardConfig = {
    draggable: true,
    dropOffBoard: 'trash',
    onDragStart: onDragStart,
    onDrop: onDrop
}
const pieces = {
    k: 'king',
    q: 'queen',
    r: 'rook',
    b: 'bishop',
    k: 'knight',
    p: 'pawn'
}
const colors = {
    w: 'white',
    b: 'black'
}

var isMachinePlayer = false;

board = Chessboard('gameBoard', boardConfig);
function onDragStart (source, piece, position, orientation) {
    if(chess.in_checkmate()){
        let confirm = window.confirm("You Lost! Reset the game?");
        let room = $('#currentGame li.active button').data('room');
        if(confirm){
            if(isMachinePlayer){
                chess.reset();
                board.start();
            } else {

                //socket.requestNewGame();
                socket.emit('gameWon', { 
                    room: room,
                });
            }
        }
    }
    if ( chess.game_over() || 
        (playerColor=='white'&& piece.search(/^b/) !== -1)||
        (playerColor=='black'&& piece.search(/^w/) !== -1)||
        (chess.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (chess.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false
    }
}

function onDrop(source, target, piece, newPos, oldPos, orientation){
    // see if the move is legal
    let turn = chess.turn();
    //currentplayers - dajmy osobną tablicę z playerami do których będzie się odnosił room
    let room = $('#currentGame li.active button').data('room');
    let move = chess.move({
        color: turn,
        from: source,
        to: target,
        
        //promotion: document.getElementById("promote").value
    });

    // illegal move
    if (move === null) return 'snapback';
    updateStatus();
    //player just end turn, CPU starts searching after a second
    if(isMachinePlayer){
        //window.setTimeout(chessEngine.prepareAiMove(),500);
    }
    else {
        socket.emit('chessMove', { 
            room: room,
            color: turn, 
            from: move.from, 
            to: move.to,
            piece: move.piece
        });
    }

}

function updateStatus(){
    let status = "";
    let moveColor = "White";
    if(chess.turn()=='b'){  
        moveColor = "Black";
    }
        info
        .html('<div class="alert alert-success">Turn for: '+moveColor+'.</div>');
    if(chess.in_checkmate()==true){
        status=  "You won, " + moveColor + " is in checkmate";
         info
        .html(status);
        if(isMachinePlayer){
            chess.reset();
            board.start();
        }
        return; 
    } else if(chess.in_draw()){
        status = "Game Over, Drawn";
         info
        .html(status);
        return;
    }
}


$(function(){
	console.log('start');
    $(document).on('click', '.setOrientation', function(){
        socket.emit('setOrientation', {
            room: $(this).data('room'),
            color: ($(this).data('color') === 'black') ? 'white': 'black'
        });
        playerColor = $(this).data('color');
        board.orientation(playerColor);

        board.start();
        if($(this).data('color') == 'black'){
            info
            .html('<div class="alert alert-success">Great ! Let\'s start game. You choose Black. Wait for White Move.</div>');
        }else{
            info
            .html('<div class="alert alert-success">Great ! Let\'s start game. You choose White. Start with First Move.</div>');
        }
    });

    $(document).on('click', '.chatsend', function(e){
        e.preventDefault();
        let msg = $.trim( chatMessage.val() );
        if(msg !== "") {socket.emit('chatMessage', {
            msg,
        });
        }
        chatMessage.val("");
    });

    $(document).on('click', '.chatsendD', function(e){
        e.preventDefault();
        let msg = $.trim( chatMessageD.val() );
        let room = $('#currentGame li.active button').data('room');
        if(msg !== "") {socket.emit('chatMessageD', {
            msg, room
        });
        }
        chatMessageD.val("");
    });


    socket.on('oppntChessMove', (data) => {
        let color = data.color;
        let source = data.from;
        piece = data.piece
        let target = data.to;
        let promo = data.promo||'';

        info
        .html('<div class="alert alert-success">'+colors[color]+' '+pieces[piece]+' form '+source+' to '+target+' '+promo+'. Your turn!</div>');

        chess.move({from:source,to:target,promotion:promo});
        board.position(chess.fen());
/*        chess.move(target);
        chess.setFenPosition();*/

    });

    socket.on('oppntWon', (data) => {
        info
        .html('<div class="alert alert-success">You Won !!</div>');
        chess.reset();
        board.reset();
    });

});
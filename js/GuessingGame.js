var Game = function() {
  this.playersGuess = null;
  this.pastGuesses = [];
  this.winningNumber = generateWinningNumber();
}

Game.prototype.playersGuessSubmission = function(guess){
  if(typeof guess !== "number" || guess < 1 || guess > 100) {
    throw "That is an invalid guess.";
  }
  this.playersGuess = guess;
  return this.checkGuess();
};

Game.prototype.checkGuess = function(){
  if(this.playersGuess===this.winningNumber) {
    $('#hint, #submit').prop("disabled", true);
    $('#subtitle').text("Press the Reset button to play again!")
    return "You Win!"
  } else {
    if(this.pastGuesses.indexOf(this.playersGuess) > -1){
      return "You have already guessed that number.";
    } else {
      this.pastGuesses.push(this.playersGuess);
      $('#guess-list li:nth-child('+ this.pastGuesses.length +')').text(this.playersGuess);
      if(this.pastGuesses.length === 5) {
        $('#hint, #submit').prop("disabled",true);
        $('#subtitle').text("Press the Reset button to play again!");
        return "You Lose.";
      } else {
        var diff = this.difference();
        if (diff < 10) return 'You\'re burning up!';
        else if (diff < 25) return 'You\'re lukewarm.';
        else if (diff < 50) return 'You\'re a bit chilly.';
        else return 'You\'re ice cold!';
      }
    }
  }
};

Game.prototype.difference = function(){
    return Math.abs(this.playersGuess - this.winningNumber);
};

Game.prototype.isLower = function(){
    return this.playersGuess < this.winningNumber;
};

Game.prototype.provideHint = function(){
  var hintArray = [this.winningNumber, generateWinningNumber(), generateWinningNumber()];
  return shuffle(hintArray);
};

function generateWinningNumber(){
  return Math.floor(Math.random() * 100 + 1);
}

function newGame(){
  return new Game(); //check that old game !== new game
}

function shuffle(array){

  var m = array.length, t, i;
  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

function makeAGuess(game) {

    var guess = $("#player-input").val();
    $("#player-input").val("");
    var output = game.playersGuessSubmission(parseInt(guess,10));
    $("#title").text(output);
    console.log("this is your Guess: "+guess);
}

$(document).ready(function(){
  var game = new Game();

$('#submit').click(function(e){
    makeAGuess(game);
  });

$('#player-input').keypress(function(event) {
    if ( event.which == 13 ) {
      makeAGuess(game);
    }
  });

$('#hint').click(function() {
        var hints = game.provideHint();
        $('#title').text('The winning number is '+hints[0]+', '+hints[1]+', or '+hints[2]);
  });

$('#reset').click(function() {
        game = newGame();
        $('#title').html( "<font color='red'>P</font><font color='green'>l</font><font color='yellow'>a</font><font color='blue'>y </font><font color='green'>t</font><font color='red'>h</font><font color='brown'>e </font><font color='blue'>G</font><font color='purple'>u</font><font color='silver'>e</font><font color='black'>s</font><font color='red'>s</font><font color='black'>i</font><font color='red'>n</font><font color='red'>g </font><font color='blue'>G</font><font color='green'>a</font><font color='brown'>m</font><font color='red'>e</font><font color='red'>!</font>" );
        $('#subtitle').text( "Guess a number between 1-100!" );
        $('.guess').text( "-" );
        $('#hint, #submit').prop("disabled",false);
  });

});



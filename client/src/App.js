import React, { Component } from 'react';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import './App.css';

const styles = {
  button: {
    margin: 5,
    height: 50,
    width: '95%',
  },
  container: {
    marginTop: 10,
    width: 1025,
    height: 440,
    margin: 'auto',
  },
  panel: {
    marginTop: 10,
    width: 500,
    height: 175,
    margin: 'auto',
  },
};

const startingHandSize = 2;
const blackjackValue = 21;
const faceCardValue = 10;
const variableAceValue = 10;
const labels = {
  actions: 'Player Actions',
  blackjack: 'Blackjack',
  gameStart: 'Start Game',
  hit: 'Hit',
  house: 'House',
  player: 'Player',
  stand: 'Stand', 
  score: 'score',
  winnerLabel: 'The winner is',
}

class App extends Component {

  state = {
    player1: [],
    house: [],
    deckId: null,
    gameStarted: false,
    gameEnded: false,
  };

  // calculate the optimal value of a hand, given an array of cards
  calculateScore = playerHand => {
    let count = 0;
    let numAces = 0;
    for (let i = 0; i < playerHand.length; i++) {
      const { value } = playerHand[i];
      switch (value) {
        case 'JACK':
        case 'QUEEN':
        case 'KING':
          count += faceCardValue;
          break;
        case 'ACE':
          count += 1;
          numAces++;
          break;
        default: // 1-10
          count += parseInt(value);
      }
    }
    for (let i = 0; i < numAces; i++) {
      if (count + variableAceValue <= blackjackValue) {
        count += variableAceValue;
      } else {
        break;
      }
    }
    return count;
  }

  // extract the relevant fields of the returned cards
  parseCardResults = cards => cards.map(card => ({ value: card.value, image: card.image }));

  // helper function around issuing GET requests via fetch
  get = (url) => 
    fetch(url, {
      method: 'GET',
    })
    .then((response) => {
      if (!response.ok) {
        throw Error(response.statusText)
      } else {
        return response.json();
      }
    })

  // draw {count} cards from the deck and add them to the hand of {playerId}
  drawCards = (playerId, count) => {
    const { deckId, [playerId]: playerHand } = this.state;
    return this.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`)
      .then((results) => this.setState({ [playerId]: playerHand.concat(this.parseCardResults(results.cards)) }))
      .catch((error) => alert(`unable to draw cards: ${error}`));
  }

  // set the deckId to a new, shuffled deck
  shuffleDeck = () =>
    this.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
      .then((results) => this.setState({ deckId: results.deck_id }))
      .catch((error) => alert(`unable to shuffle deck: ${error}`));

  // reset the Blackjack game
  resetGame = () =>
    new Promise((resolve, reject) => {
      this.setState({
        player1: [],
        house: [],
        gameStarted: true,
        gameEnded: false,
        deckId: '',
      }, resolve());
    });

  // start the Blackjack game (clear hands, shuffle deck, and deal new hands)
  startGame = () => {
    this.resetGame()
      .then(() => this.shuffleDeck())
      .then(() => this.drawCards('house', startingHandSize))
      .then(() => this.drawCards('player1', startingHandSize));
  }
  
  // calculate the winner of the Blackjack game
  calculateWinner = () => {
    const { house, player1 } = this.state;
    const [houseScore, playerScore] = [this.calculateScore(house), this.calculateScore(player1)];
    if ((houseScore > blackjackValue && playerScore < blackjackValue) || (playerScore < blackjackValue && playerScore > houseScore) || (playerScore === blackjackValue && houseScore !== blackjackValue)) return 'player1';
    return 'house';
  }

  render() {
    const { classes } = this.props;
    const { gameEnded, gameStarted, player1, house } = this.state;
    return (
      <Card className={classes.container}>
        <CardHeader
          title={labels.blackjack}
        >
        </CardHeader>
        <Grid container spacing={24}>
          <Grid item xs={6}>
            <Card className={classes.panel}>
              <CardHeader
                title={`${labels.house} ${gameStarted ? `(${labels.score}: ${this.calculateScore(house)})` : ''}`}
              >
              </CardHeader>
              <CardContent>
                {house.map(card => <img alt="card" style={{ height: 70, width: 50, marginRight: 5 }} src={card.image} />)}
              </CardContent>
            </Card>
            <Card className={classes.panel}>
              <CardHeader
                title={`${labels.player} ${gameStarted ? `(${labels.score}: ${this.calculateScore(player1)})` : ''}`}
              >
              </CardHeader>
              <CardContent>
                {player1.map(card => <img alt="card" style={{ height: 70, width: 50, marginRight: 5 }} src={card.image} />)}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card className={classes.panel}>
              <CardContent>
                <Button onClick={this.startGame} className={classes.button} variant="contained" disabled={gameStarted && !gameEnded}>
                    {labels.gameStart}
                </Button>
                {gameEnded && <Typography variant="h4">{`${labels.winnerLabel}: ${this.calculateWinner()}`}</Typography>}
              </CardContent>
            </Card>
            <Card className={classes.panel}>
              <CardHeader
                title={labels.actions}
              >
              </CardHeader>
              <Grid container spacing={24}>
                <Grid item xs={6}>
                  <Button onClick={() => this.drawCards('player1', 1)} className={classes.button} variant="contained" disabled={!gameStarted || gameEnded}>
                    {labels.hit}
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button onClick={() => this.setState({ gameEnded: true })} className={classes.button} variant="contained" disabled={!gameStarted || gameEnded}>
                    {labels.stand}
                  </Button>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </Card>
    );
  }
}

export default withStyles(styles)(App);

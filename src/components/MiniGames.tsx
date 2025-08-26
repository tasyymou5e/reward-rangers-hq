import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gamepad2, Puzzle, Trophy, Star, RefreshCw, CheckCircle } from 'lucide-react';

interface MiniGamesProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (points: number) => void;
  choreTitle?: string;
}

interface PuzzlePiece {
  id: number;
  position: number;
  correctPosition: number;
}

export function MiniGames({ isOpen, onClose, onComplete, choreTitle }: MiniGamesProps) {
  const [selectedGame, setSelectedGame] = useState<'puzzle' | 'memory' | 'colors' | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Puzzle Game State
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([]);
  const [moves, setMoves] = useState(0);

  // Memory Game State
  const [memoryCards, setMemoryCards] = useState<{ id: number; value: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);

  // Color Game State
  const [targetColor, setTargetColor] = useState<string>('');
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [colorScore, setColorScore] = useState(0);
  const [round, setRound] = useState(1);

  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
  const emojis = ['🎈', '🌟', '🎁', '🚀', '🦄', '🌈', '🎨', '🎪'];

  useEffect(() => {
    if (isOpen && !selectedGame) {
      resetGames();
    }
  }, [isOpen]);

  const resetGames = () => {
    setSelectedGame(null);
    setGameCompleted(false);
    setScore(0);
    setMoves(0);
    setMatches(0);
    setColorScore(0);
    setRound(1);
  };

  const initializePuzzle = () => {
    const pieces = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      position: i,
      correctPosition: i
    }));
    
    // Shuffle pieces
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i].position, pieces[j].position] = [pieces[j].position, pieces[i].position];
    }
    
    setPuzzlePieces(pieces);
    setMoves(0);
  };

  const initializeMemoryGame = () => {
    const shuffledEmojis = [...emojis.slice(0, 4), ...emojis.slice(0, 4)]
      .sort(() => Math.random() - 0.5);
    
    const cards = shuffledEmojis.map((emoji, index) => ({
      id: index,
      value: emoji,
      flipped: false,
      matched: false
    }));
    
    setMemoryCards(cards);
    setFlippedCards([]);
    setMatches(0);
  };

  const initializeColorGame = () => {
    const target = colors[Math.floor(Math.random() * colors.length)];
    const options = [target];
    
    while (options.length < 4) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      if (!options.includes(randomColor)) {
        options.push(randomColor);
      }
    }
    
    setTargetColor(target);
    setColorOptions(options.sort(() => Math.random() - 0.5));
    setColorScore(0);
    setRound(1);
  };

  const movePuzzlePiece = (pieceId: number) => {
    const piece = puzzlePieces.find(p => p.id === pieceId);
    const emptySpot = puzzlePieces.find(p => p.position === 8); // Last position is empty
    
    if (!piece || !emptySpot) return;
    
    // Check if pieces are adjacent
    const pieceRow = Math.floor(piece.position / 3);
    const pieceCol = piece.position % 3;
    const emptyRow = Math.floor(emptySpot.position / 3);
    const emptyCol = emptySpot.position % 3;
    
    const isAdjacent = (Math.abs(pieceRow - emptyRow) === 1 && pieceCol === emptyCol) ||
                      (Math.abs(pieceCol - emptyCol) === 1 && pieceRow === emptyRow);
    
    if (isAdjacent) {
      const newPieces = puzzlePieces.map(p => {
        if (p.id === pieceId) return { ...p, position: emptySpot.position };
        if (p.id === emptySpot.id) return { ...p, position: piece.position };
        return p;
      });
      
      setPuzzlePieces(newPieces);
      setMoves(moves + 1);
      
      // Check if puzzle is solved
      const solved = newPieces.slice(0, 8).every(p => p.position === p.correctPosition);
      if (solved) {
        const points = Math.max(100 - moves * 2, 20);
        setScore(points);
        setGameCompleted(true);
      }
    }
  };

  const flipMemoryCard = (cardId: number) => {
    if (flippedCards.length === 2 || memoryCards[cardId].flipped || memoryCards[cardId].matched) return;
    
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    const newCards = memoryCards.map(card => 
      card.id === cardId ? { ...card, flipped: true } : card
    );
    setMemoryCards(newCards);
    
    if (newFlippedCards.length === 2) {
      const [first, second] = newFlippedCards;
      if (memoryCards[first].value === memoryCards[second].value) {
        setTimeout(() => {
          setMemoryCards(cards => cards.map(card => 
            card.id === first || card.id === second ? { ...card, matched: true } : card
          ));
          setMatches(matches + 1);
          setFlippedCards([]);
          
          if (matches + 1 === 4) {
            setScore(200);
            setGameCompleted(true);
          }
        }, 500);
      } else {
        setTimeout(() => {
          setMemoryCards(cards => cards.map(card => 
            card.id === first || card.id === second ? { ...card, flipped: false } : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const selectColor = (color: string) => {
    if (color === targetColor) {
      const newScore = colorScore + 20;
      setColorScore(newScore);
      
      if (round >= 5) {
        setScore(newScore);
        setGameCompleted(true);
      } else {
        setRound(round + 1);
        setTimeout(() => {
          const target = colors[Math.floor(Math.random() * colors.length)];
          const options = [target];
          
          while (options.length < 4) {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            if (!options.includes(randomColor)) {
              options.push(randomColor);
            }
          }
          
          setTargetColor(target);
          setColorOptions(options.sort(() => Math.random() - 0.5));
        }, 1000);
      }
    } else {
      setColorScore(Math.max(0, colorScore - 5));
    }
  };

  const handleGameComplete = () => {
    onComplete(score);
    onClose();
    resetGames();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-kids-primary">
            <Gamepad2 className="h-6 w-6" />
            Celebration Games!
            {choreTitle && <span className="text-sm text-muted-foreground">- After completing {choreTitle}</span>}
          </DialogTitle>
        </DialogHeader>

        {!selectedGame && !gameCompleted && (
          <div className="space-y-6">
            <p className="text-center text-kids-primary">Choose a fun game to play! 🎉</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:scale-105 transition-transform border-kids-primary/20 hover:border-kids-primary" onClick={() => { setSelectedGame('puzzle'); initializePuzzle(); }}>
                <CardContent className="p-6 text-center">
                  <Puzzle className="h-12 w-12 mx-auto mb-3 text-kids-primary" />
                  <h3 className="font-bold text-kids-primary">Puzzle Game</h3>
                  <p className="text-sm text-muted-foreground">Solve the sliding puzzle!</p>
                  <Badge className="mt-2 bg-kids-accent">Up to 100 XP</Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:scale-105 transition-transform border-kids-primary/20 hover:border-kids-primary" onClick={() => { setSelectedGame('memory'); initializeMemoryGame(); }}>
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 mx-auto mb-3 text-kids-secondary" />
                  <h3 className="font-bold text-kids-primary">Memory Match</h3>
                  <p className="text-sm text-muted-foreground">Find matching pairs!</p>
                  <Badge className="mt-2 bg-kids-secondary">200 XP</Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:scale-105 transition-transform border-kids-primary/20 hover:border-kids-primary" onClick={() => { setSelectedGame('colors'); initializeColorGame(); }}>
                <CardContent className="p-6 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-kids-accent" />
                  <h3 className="font-bold text-kids-primary">Color Challenge</h3>
                  <p className="text-sm text-muted-foreground">Pick the right colors!</p>
                  <Badge className="mt-2 bg-kids-accent">100 XP</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {selectedGame === 'puzzle' && !gameCompleted && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="outline">Moves: {moves}</Badge>
              <Button size="sm" variant="outline" onClick={initializePuzzle}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {Array.from({ length: 9 }, (_, i) => {
                const piece = puzzlePieces.find(p => p.position === i);
                if (!piece || piece.id === 8) {
                  return <div key={i} className="w-20 h-20 border-2 border-dashed border-kids-primary/30 rounded-lg"></div>;
                }
                return (
                  <Button
                    key={piece.id}
                    className="w-20 h-20 text-lg font-bold bg-kids-primary hover:bg-kids-primary/90"
                    onClick={() => movePuzzlePiece(piece.id)}
                  >
                    {piece.id + 1}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {selectedGame === 'memory' && !gameCompleted && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="outline">Matches: {matches}/4</Badge>
            </div>
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {memoryCards.map((card) => (
                <Button
                  key={card.id}
                  className={`h-16 text-2xl ${
                    card.flipped || card.matched 
                      ? 'bg-kids-secondary hover:bg-kids-secondary' 
                      : 'bg-kids-primary hover:bg-kids-primary/90'
                  }`}
                  onClick={() => flipMemoryCard(card.id)}
                  disabled={card.matched || flippedCards.length === 2}
                >
                  {card.flipped || card.matched ? card.value : '?'}
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedGame === 'colors' && !gameCompleted && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Badge variant="outline">Round {round}/5</Badge>
              <Badge variant="outline">Score: {colorScore}</Badge>
              <div className="p-4 bg-kids-background rounded-lg">
                <p className="text-lg font-bold text-kids-primary">Find the color: {targetColor}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              {colorOptions.map((color, index) => (
                <Button
                  key={index}
                  className="h-16 text-white font-bold capitalize"
                  style={{ backgroundColor: color }}
                  onClick={() => selectColor(color)}
                >
                  {color}
                </Button>
              ))}
            </div>
          </div>
        )}

        {gameCompleted && (
          <div className="text-center space-y-6">
            <div className="animate-bounce">
              <CheckCircle className="h-16 w-16 mx-auto text-kids-success" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-kids-primary mb-2">🎉 Amazing! 🎉</h3>
              <p className="text-lg">You earned <Badge className="bg-kids-accent text-white">{score} XP</Badge> bonus points!</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleGameComplete} className="bg-kids-primary hover:bg-kids-primary/90">
                Collect Reward
              </Button>
              <Button variant="outline" onClick={() => {
                setGameCompleted(false);
                setSelectedGame(null);
              }}>
                Play Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
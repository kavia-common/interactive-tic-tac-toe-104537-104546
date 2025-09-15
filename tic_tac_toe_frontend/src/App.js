import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Game constants and helpers
 */
const EMPTY_BOARD = Array(9).fill(null);
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function calculateWinner(squares) {
  for (const [a, b, c] of LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

function isBoardFull(squares) {
  return squares.every((s) => s !== null);
}

function getAvailableMoves(squares) {
  return squares
    .map((v, i) => (v === null ? i : null))
    .filter((v) => v !== null);
}

// A simple but competent AI using minimax with pruning for 3x3 tic-tac-toe
function minimax(squares, isMaximizing, aiPlayer, humanPlayer, depth = 0, alpha = -Infinity, beta = Infinity) {
  const winInfo = calculateWinner(squares);
  if (winInfo) {
    return winInfo.winner === aiPlayer ? 10 - depth : depth - 10;
  }
  if (isBoardFull(squares)) return 0;

  const moves = getAvailableMoves(squares);
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of moves) {
      squares[move] = aiPlayer;
      const score = minimax(squares, false, aiPlayer, humanPlayer, depth + 1, alpha, beta);
      squares[move] = null;
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const move of moves) {
      squares[move] = humanPlayer;
      const score = minimax(squares, true, aiPlayer, humanPlayer, depth + 1, alpha, beta);
      squares[move] = null;
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return bestScore;
  }
}

function getBestMove(squares, aiPlayer, humanPlayer) {
  let bestScore = -Infinity;
  let bestMove = null;
  for (const move of getAvailableMoves(squares)) {
    squares[move] = aiPlayer;
    const score = minimax(squares, false, aiPlayer, humanPlayer, 0, -Infinity, Infinity);
    squares[move] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

/**
 * UI Components
 */

function Header({ theme, onToggleTheme }) {
  return (
    <header className="ttt-header">
      <div className="brand">
        <span role="img" aria-label="game">🎮</span> Tic-Tac-Toe
      </div>
      <div className="actions">
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  );
}

function ModeSelector({ mode, setMode, starting, setStarting, resetGame }) {
  return (
    <div className="panel">
      <div className="row">
        <label className="label">Mode</label>
        <div className="segmented">
          <button
            className={mode === 'pvp' ? 'seg active' : 'seg'}
            onClick={() => { setMode('pvp'); resetGame(); }}
          >
            Player vs Player
          </button>
          <button
            className={mode === 'ai' ? 'seg active' : 'seg'}
            onClick={() => { setMode('ai'); resetGame(); }}
          >
            Player vs Computer
          </button>
        </div>
      </div>
      {mode === 'ai' && (
        <div className="row">
          <label className="label">You play as</label>
          <div className="segmented">
            <button
              className={starting === 'X' ? 'seg active' : 'seg'}
              onClick={() => { setStarting('X'); resetGame(); }}
            >
              X (first)
            </button>
            <button
              className={starting === 'O' ? 'seg active' : 'seg'}
              onClick={() => { setStarting('O'); resetGame(); }}
            >
              O (second)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Square({ value, onClick, highlight }) {
  return (
    <button
      className={`square ${highlight ? 'highlight' : ''}`}
      onClick={onClick}
      aria-label={`Square ${value ? value : 'empty'}`}
    >
      {value}
    </button>
  );
}

function Board({ squares, onPlay, winningLine, disabled }) {
  return (
    <div className="board">
      {squares.map((val, idx) => (
        <Square
          key={idx}
          value={val}
          onClick={() => onPlay(idx)}
          highlight={winningLine?.includes(idx)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function StatusBar({ status, onReset, canUndo, onUndo, onRedo, canRedo }) {
  return (
    <div className="statusbar">
      <div className="status">{status}</div>
      <div className="controls">
        <button className="btn" onClick={onUndo} disabled={!canUndo}>↩ Undo</button>
        <button className="btn" onClick={onRedo} disabled={!canRedo}>↪ Redo</button>
        <button className="btn btn-primary" onClick={onReset}>↻ Reset</button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Theme handling */
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  /** Game mode and options */
  const [mode, setMode] = useState('ai'); // 'ai' or 'pvp'
  const [starting, setStarting] = useState('X'); // When vs AI, user mark

  /** Game state with history for undo/redo */
  const [history, setHistory] = useState([EMPTY_BOARD]);
  const [step, setStep] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);

  const current = history[step];
  const winInfo = useMemo(() => calculateWinner(current), [current]);
  const isDraw = !winInfo && isBoardFull(current);

  const humanMark = mode === 'ai' ? starting : 'X';
  const aiMark = humanMark === 'X' ? 'O' : 'X';
  const currentTurnMark = xIsNext ? 'X' : 'O';

  /** Derived status message */
  const status = useMemo(() => {
    if (winInfo) {
      return `Winner: ${winInfo.winner}`;
    }
    if (isDraw) {
      return 'Draw! No more moves.';
    }
    const turnOwner =
      mode === 'ai'
        ? currentTurnMark === humanMark
          ? 'You'
          : 'Computer'
        : currentTurnMark === 'X'
        ? 'Player X'
        : 'Player O';
    return `${turnOwner}'s turn (${currentTurnMark})`;
  }, [winInfo, isDraw, mode, currentTurnMark, humanMark]);

  /** Handlers */
  function resetGame() {
    setHistory([EMPTY_BOARD]);
    setStep(0);
    setXIsNext(true);
  }

  function makeMove(index) {
    if (winInfo || current[index] || isDraw) return;
    const next = current.slice();
    next[index] = currentTurnMark;
    const newHistory = history.slice(0, step + 1).concat([next]);
    setHistory(newHistory);
    setStep(newHistory.length - 1);
    setXIsNext(!xIsNext);
  }

  function handlePlay(index) {
    // If it's AI's turn in AI mode, ignore clicks
    if (mode === 'ai' && currentTurnMark !== humanMark) return;
    makeMove(index);
  }

  function undo() {
    if (step > 0) {
      setStep(step - 1);
      setXIsNext(((step - 1) % 2) === 0); // step 0 => X turn
    }
  }

  function redo() {
    if (step < history.length - 1) {
      setStep(step + 1);
      setXIsNext(((step + 1) % 2) === 0 ? true : false);
      // Correction: after moving to step+1, next player is:
      // If number of moves made equals step+1, then XIsNext is (moves % 2 === 0)
      const moves = step + 1;
      setXIsNext(moves % 2 === 0);
    }
  }

  // Ensure xIsNext stays in sync with step on history changes (safety)
  useEffect(() => {
    const moves = step;
    setXIsNext(moves % 2 === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, history.length]);

  /** AI move effect */
  useEffect(() => {
    if (mode !== 'ai') return;
    if (winInfo || isDraw) return;
    if (currentTurnMark === aiMark) {
      // small delay for UX
      const t = setTimeout(() => {
        const best = getBestMove(current.slice(), aiMark, humanMark);
        // Fallback to random if something odd
        const move = best !== null ? best : getAvailableMoves(current)[0];
        if (move !== undefined && move !== null) {
          makeMove(move);
        }
      }, 350);
      return () => clearTimeout(t);
    }
  }, [mode, aiMark, humanMark, current, currentTurnMark, winInfo, isDraw]);

  /** Start-of-game: if AI goes first */
  useEffect(() => {
    if (mode === 'ai') {
      const isAIFirst = starting === 'O';
      // Starting as O means human is O, AI is X and goes first
      if (isAIFirst && step === 0 && current.every((v) => v === null) && currentTurnMark === 'X') {
        const t = setTimeout(() => {
          const move = getBestMove(current.slice(), 'X', 'O') ?? 0;
          makeMove(move);
        }, 350);
        return () => clearTimeout(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, starting]);

  const winningLine = winInfo?.line;

  return (
    <div className="App">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main className="container">
        <h1 className="title">Play Tic-Tac-Toe</h1>
        <p className="description">
          Choose a mode and start playing. Get three in a row to win!
        </p>

        <ModeSelector
          mode={mode}
          setMode={setMode}
          starting={starting}
          setStarting={setStarting}
          resetGame={resetGame}
        />

        <StatusBar
          status={status}
          onReset={resetGame}
          onUndo={undo}
          onRedo={redo}
          canUndo={step > 0}
          canRedo={step < history.length - 1}
        />

        <Board
          squares={current}
          onPlay={handlePlay}
          winningLine={winningLine}
          disabled={!!winInfo || isDraw}
        />

        <footer className="footer">
          <div className="legend">
            <span className="badge x">X</span> vs <span className="badge o">O</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;

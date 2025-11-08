import React, { useRef, useEffect, useState, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Shield, Eye, Heart, FileCheck, AlertTriangle, CloudRain, LampWallUp as BrickWall, Wind as Storm, ArrowUp } from 'lucide-react';

    const Game = () => {
      const canvasRef = useRef(null);
      const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameOver'
      const [score, setScore] = useState(0);
      const [finalScore, setFinalScore] = useState(0);
      const [tooltip, setTooltip] = useState(null);
      const [isPaused, setIsPaused] = useState(false);
      
      const gameSpeed = useRef(5);
      const scoreRef = useRef(0);
      
      const player = useRef({ x: 50, y: 250, width: 30, height: 30, dy: 0, gravity: 0.8, jumpPower: -15, onGround: true });
      const obstacles = useRef([]);
      const powerups = useRef([]);
      const frameCount = useRef(0);

      const OBSTACLES_CONFIG = [
        { name: "Bias Trap", color: "#f59e0b", message: "Bias Trap encountered! Strive for fairness." },
        { name: "Data Leak Pit", color: "#ef4444", message: "Data Leak Pit detected! Strengthen governance!" },
        { name: "Compliance Wall", color: "#3b82f6", message: "Your AI hit a Compliance Wall! Stay updated." },
        { name: "Adversarial Attack", color: "#8b5cf6", message: "Adversarial Attack! Fortify your defenses." },
      ];

      const POWERUPS_CONFIG = [
        { name: "Governance Shield", color: "#22c55e" },
        { name: "Transparency Boost", color: "#38bdf8" },
        { name: "Ethics Token", color: "#ec4899" },
        { name: "Audit Pass", color: "#14b8a6" },
      ];
      
      const drawPlayer = (ctx) => {
        ctx.fillStyle = '#6d28d9';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('My AI System', player.current.x + player.current.width / 2, player.current.y - 8);

        ctx.fillStyle = 'rgba(139, 92, 246, 1)';
        ctx.shadowColor = 'rgba(139, 92, 246, 0.7)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(player.current.x, player.current.y, player.current.width, player.current.height, 5);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.textAlign = 'start';
      };

      const drawPowerups = (ctx) => {
        powerups.current.forEach(p => {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      };

      const showTooltip = (message) => {
        setTooltip(message);
        setTimeout(() => setTooltip(null), 2000);
      };
      
      const startGame = useCallback(() => {
        player.current = { x: 50, y: 250, width: 30, height: 30, dy: 0, gravity: 0.8, jumpPower: -15, onGround: true };
        obstacles.current = [];
        powerups.current = [];
        gameSpeed.current = 6;
        scoreRef.current = 0;
        setScore(0);
        frameCount.current = 0;
        setIsPaused(false);
        setGameState('playing');
      }, []);

      const performJump = useCallback(() => {
        if (gameState === 'playing' && player.current.onGround && !isPaused) {
          player.current.dy = player.current.jumpPower;
          player.current.onGround = false;
        } else if (gameState !== 'playing') {
          startGame();
        }
      }, [gameState, isPaused, startGame]);

      const performExternalJump = useCallback(() => {
        if (gameState === 'playing' && player.current.onGround && !isPaused) {
          player.current.dy = player.current.jumpPower;
          player.current.onGround = false;
        }
      }, [gameState, isPaused]);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const gameLoop = () => {
          if (gameState === 'playing' && !isPaused) {
            frameCount.current++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(249, 250, 251, 0.8)';
            ctx.fillRect(0,0, canvas.width, canvas.height);
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(0, 280, canvas.width, 20);

            player.current.dy += player.current.gravity;
            player.current.y += player.current.dy;
            if (player.current.y + player.current.height >= 280) {
              player.current.y = 280 - player.current.height;
              player.current.dy = 0;
              player.current.onGround = true;
            }
            drawPlayer(ctx);

            if (frameCount.current % Math.floor(120 / (gameSpeed.current/6)) === 0) {
              const config = OBSTACLES_CONFIG[Math.floor(Math.random() * OBSTACLES_CONFIG.length)];
              obstacles.current.push({ x: canvas.width, y: 250, width: 30, height: 30, ...config });
            }

            if (frameCount.current > 300 && frameCount.current % 350 === 0) {
              const config = POWERUPS_CONFIG[Math.floor(Math.random() * POWERUPS_CONFIG.length)];
              powerups.current.push({ x: canvas.width, y: 180, width: 20, height: 20, ...config });
            }

            obstacles.current.forEach((obs, index) => {
              obs.x -= gameSpeed.current;
              ctx.fillStyle = obs.color;
              ctx.beginPath();
              ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 5);
              ctx.fill();
              if (obs.x + obs.width < 0) obstacles.current.splice(index, 1);
            });

            powerups.current.forEach((p, index) => {
              p.x -= gameSpeed.current;
              if (p.x + p.width < 0) powerups.current.splice(index, 1);
            });
            drawPowerups(ctx);

            obstacles.current.forEach(obs => {
              if (player.current.x < obs.x + obs.width && player.current.x + player.current.width > obs.x && player.current.y < obs.y + obs.height && player.current.y + player.current.height > obs.y) {
                showTooltip(obs.message);
                setFinalScore(scoreRef.current);
                setGameState('gameOver');
              }
            });

            powerups.current.forEach((p, index) => {
              if (player.current.x < p.x + p.width && player.current.x + player.current.width > p.x && player.current.y < p.y + p.height && player.current.y + player.current.height > p.y) {
                scoreRef.current += 50;
                powerups.current.splice(index, 1);
              }
            });

            scoreRef.current++;
            setScore(scoreRef.current);
            gameSpeed.current += 0.007;
          }
          
          animationFrameId = requestAnimationFrame(gameLoop);
        };

        gameLoop();

        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                performJump();
            }
        };

        const handleTouchStart = (e) => {
            e.preventDefault();
            performJump();
        };

        const handleVisibilityChange = () => {
          if (document.hidden) {
            setIsPaused(true);
          }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('mousedown', handleTouchStart, { passive: false });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          cancelAnimationFrame(animationFrameId);
          window.removeEventListener('keydown', handleKeyDown);
          canvas.removeEventListener('touchstart', handleTouchStart);
          canvas.removeEventListener('mousedown', handleTouchStart);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }, [gameState, isPaused, performJump, startGame]);

      return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
            <div className="w-full relative glass-effect rounded-2xl p-2 sm:p-4 md:p-8 gradient-border touch-manipulation">
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-base sm:text-lg font-bold text-slate-700 z-10">Maturity Level: {Math.floor(score/100)}</div>
                {tooltip && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-20 pointer-events-none"
                    >
                        {tooltip}
                    </motion.div>
                )}

                {gameState !== 'playing' && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex flex-col justify-center items-center z-10 rounded-2xl text-center p-4">
                        {gameState === 'start' ? (
                            <>
                                <motion.h3 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-4">AI Maturity Run</motion.h3>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white mb-6">Tap or press Space to jump over obstacles!</motion.p>
                                <Button onClick={startGame} size="lg" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white pulse-glow">Start Game</Button>
                            </>
                        ) : ( // gameOver
                            <>
                                <motion.h3 initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="text-2xl sm:text-4xl font-bold text-white mb-2">Game Over</motion.h3>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-white text-lg sm:text-xl mb-4">You reached Level {Math.floor(finalScore/100)}!</motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-white text-sm sm:text-base max-w-md mx-auto mb-6">Join our waitlist to unlock the full MATUR.ai platform.</motion.p>
                                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-sm">
                                    <Button onClick={startGame} size="lg" variant="secondary" className="w-full">Play Again</Button>
                                    {/* Join Waitlist button is moved to be conditionally rendered after Jump button for mobile */}
                                </div>
                            </>
                        )}
                    </div>
                )}
                
                {isPaused && gameState === 'playing' && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-2xl">
                        <h3 className="text-3xl font-bold text-white mb-4">Paused</h3>
                        <Button onClick={() => setIsPaused(false)}>Resume</Button>
                    </div>
                )}
                
                <canvas ref={canvasRef} width="800" height="300" className="w-full h-auto rounded-lg cursor-pointer"></canvas>
            </div>
            
            <button
                onClick={performExternalJump}
                disabled={gameState !== 'playing'}
                className="mt-4 px-8 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-lg shadow-md hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600"
                aria-label="Jump"
            >
                Jump
            </button>
            {gameState === 'gameOver' && (
                <Button 
                    onClick={() => document.getElementById('bottom-waitlist-form')?.querySelector('input[type="email"]')?.focus()} 
                    size="lg" 
                    className="mt-3 w-full max-w-xs sm:max-w-sm bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white pulse-glow sm:hidden"
                >
                    Join Waitlist
                </Button>
            )}
            {gameState === 'gameOver' && (
                <Button 
                    onClick={() => document.getElementById('bottom-waitlist-form')?.querySelector('input[type="email"]')?.focus()} 
                    size="lg" 
                    className="hidden sm:inline-flex mt-3 ml-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white pulse-glow"
                >
                    Join Waitlist
                </Button>
            )}
        </div>
      );
    };

    export default Game;
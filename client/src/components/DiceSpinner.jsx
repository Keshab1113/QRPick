import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Crown, Target, Zap, UserPlus, Clock } from 'lucide-react';
import { Button } from './ui/button';
import Confetti from 'react-confetti';

const DiceSpinner = ({ users, onSpin, isSpinning, winner, isAdmin }) => {
  const [displayedNames, setDisplayedNames] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (users && users.length > 0) {
      // Create a circular arrangement of names
      const names = users.map(u => u.name);
      setDisplayedNames(names);
    }
  }, [users]);

  useEffect(() => {
    let interval;
    if (isSpinning) {
      interval = setInterval(() => {
        setRotation(prev => (prev + 45) % 360);
      }, 80);
    } else if (winner) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
    return () => clearInterval(interval);
  }, [isSpinning, winner]);

  const handleSpin = () => {
    if (!isSpinning && users.length > 0 && isAdmin) {
      onSpin();
    }
  };

  // Calculate number of segments based on user count
  const segments = Math.min(Math.max(users.length, 8), 16);
  const segmentAngle = 360 / segments;

  // Color palette for segments
  const segmentColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* Confetti celebration */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}

      {/* Spinner Circle */}
      <div className="relative w-96 h-96 flex items-center justify-center">
        {/* Outer decorative rings */}
        <div className="absolute inset-0 rounded-full border-8 border-gradient-to-r from-blue-400/30 to-purple-400/30 animate-pulse" />
        <div className="absolute inset-4 rounded-full border-4 border-gradient-to-r from-blue-300/20 to-purple-300/20" />
        
        {/* Glowing effect */}
        {isSpinning && (
          <div className="absolute inset-[-10px] rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl animate-pulse" />
        )}

        {/* Main spinner */}
        <motion.div
          className="relative w-80 h-80 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-8 border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden"
          animate={{ 
            rotate: isSpinning ? rotation : 0,
            scale: isSpinning ? 1.05 : 1
          }}
          transition={{ 
            duration: isSpinning ? 0.08 : 0.8,
            ease: isSpinning ? "linear" : [0.68, -0.55, 0.265, 1.55]
          }}
        >
          {/* Segments background */}
          <div className="absolute inset-0">
            {Array.from({ length: segments }).map((_, index) => {
              const colorIndex = index % segmentColors.length;
              return (
                <div
                  key={`segment-${index}`}
                  className="absolute top-0 left-1/2 origin-left"
                  style={{
                    width: '160px',
                    height: '160px',
                    transform: `rotate(${segmentAngle * index}deg)`,
                    clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)',
                    backgroundColor: isSpinning 
                      ? segmentColors[(colorIndex + Math.floor(rotation/45)) % segmentColors.length] + '40'
                      : segmentColors[colorIndex] + '30',
                    transition: 'background-color 0.3s ease'
                  }}
                />
              );
            })}
          </div>

          {/* User names on the wheel */}
          {displayedNames.length > 0 && (
            <div className="absolute inset-0">
              {displayedNames.slice(0, segments).map((name, index) => {
                const angle = segmentAngle * index;
                const isHighlighted = winner && users.find(u => u.name === name)?.id === winner.id;
                
                return (
                  <motion.div
                    key={index}
                    className="absolute top-1/2 left-1/2 origin-left"
                    style={{
                      transform: `rotate(${angle}deg) translateX(140px)`,
                    }}
                    animate={isHighlighted ? {
                      scale: [1, 1.2, 1],
                      transition: { repeat: 3, duration: 0.5 }
                    } : {}}
                  >
                    <div 
                      className={`text-sm font-bold whitespace-nowrap px-2 py-1 rounded-full backdrop-blur-sm ${
                        isHighlighted 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg' 
                          : 'bg-white/10 text-white/90'
                      }`}
                      style={{ 
                        transform: `rotate(-${angle}deg)`,
                        boxShadow: isHighlighted ? '0 0 20px rgba(245, 158, 11, 0.5)' : 'none'
                      }}
                    >
                      {name.substring(0, 10)}
                      {name.length > 10 && '...'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Center content */}
          <div className="relative z-20 text-center">
            <AnimatePresence mode="wait">
              {winner ? (
                <motion.div
                  key="winner"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <Crown className="w-16 h-16 text-yellow-500 mb-2 drop-shadow-lg" />
                    <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-ping" />
                  </div>
                  <motion.p 
                    className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {winner.name}
                  </motion.p>
                  <motion.p 
                    className="text-sm text-muted-foreground mt-1"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {winner.koc_id}
                  </motion.p>
                </motion.div>
              ) : isSpinning ? (
                <motion.div
                  key="spinning"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-16 h-16 text-blue-500" />
                  </motion.div>
                  <motion.p 
                    className="text-lg font-semibold text-blue-400 mt-4"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Spinning...
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 shadow-2xl">
                    <span className="text-4xl font-bold text-white">
                      {users.length}
                    </span>
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-lg opacity-50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Participants Ready
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Click spin to start
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Spinning effect overlay */}
          {isSpinning && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* Inner ring */}
          <div className="absolute inset-10 rounded-full border-4 border-white/10" />
        </motion.div>

        {/* Animated pointer */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-30"
          animate={isSpinning ? {
            y: [-3, 0, -3],
            transition: { duration: 0.5, repeat: Infinity }
          } : {}}
        >
          <div className="relative">
            <Target className="w-8 h-8 text-red-500 drop-shadow-2xl" />
            <div className="absolute inset-0 animate-ping">
              <Target className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Spin Button - Admin Only */}
      {isAdmin && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleSpin}
            disabled={isSpinning || users.length === 0}
            size="lg"
            className="px-16 py-7 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl"
          >
            {isSpinning ? (
              <span className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
                <span className="relative">
                  Spinning...
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                    animate={{ width: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </span>
              </span>
            ) : users.length === 0 ? (
              <span className="flex items-center gap-2">
                <UserPlus className="w-6 h-6" />
                Waiting for Participants
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                SPIN THE WHEEL
                <Sparkles className="w-6 h-6" />
              </span>
            )}
          </Button>
        </motion.div>
      )}

      {/* Status Info */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border">
          {users.length === 0 ? (
            <>
              <Clock className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Waiting for participants to join...
              </p>
            </>
          ) : isSpinning ? (
            <>
              <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Good luck everyone! 🎲 The wheel is spinning...
              </p>
            </>
          ) : winner ? (
            <>
              <Trophy className="w-4 h-4 text-yellow-500" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Congratulations <span className="font-bold">{winner.name}</span>! 🎉 Winner selected!
              </p>
            </>
          ) : (
            <>
              <Target className="w-4 h-4 text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-400">
                {users.length} participant{users.length !== 1 ? 's' : ''} ready to spin!
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DiceSpinner;
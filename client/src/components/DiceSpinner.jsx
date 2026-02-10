import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Sparkles,
  Crown,
  Target,
  Zap,
  UserPlus,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "./ui/button";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";

const DiceSpinner = ({ users, onSpin, isSpinning, winner, isAdmin }) => {
  const [displayedNames, setDisplayedNames] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  const spinDuration = 6000; // 6 seconds in milliseconds
  const { width: windowWidth, height: windowHeight } = useWindowSize();

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/spinning-sound.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle audio mute/unmute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = 0.5;
      } else {
        audioRef.current.volume = 0;
      }
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    if (users && users.length > 0) {
      const names = users.map((u) => u.name);
      setDisplayedNames(names);
    }
  }, [users]);

  useEffect(() => {
    let interval;
    let spinTimeout;

    if (isSpinning) {
      // Start spinning audio
      if (audioRef.current && !isMuted) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .catch((e) => console.log("Audio play failed:", e));
      }

      // Calculate spin parameters
      const startTime = Date.now();
      const endTime = startTime + spinDuration;

      // Start with fast rotation
      interval = setInterval(() => {
        const currentTime = Date.now();
        const timeLeft = endTime - currentTime;
        const progress = 1 - timeLeft / spinDuration;

        // Easing function for smooth deceleration
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);

        // Slow down gradually over time
        const speed = 80 * (1 - progress * 0.9); // From 80ms to 8ms

        // Increase rotation angle as we slow down for visual effect
        const rotationIncrement = 45 * (1 + progress * 2);

        setRotation((prev) => (prev + rotationIncrement) % 360);

        // Stop after 5 seconds
        if (timeLeft <= 0) {
          clearInterval(interval);
          if (audioRef.current) {
            audioRef.current.pause();
          }
        }
      }, 80); // Start with 80ms interval

      // Auto-stop spinning after 5 seconds
      spinTimeout = setTimeout(() => {
        clearInterval(interval);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        // You might want to call a callback here to notify parent component
      }, spinDuration);
    } else if (winner) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(spinTimeout);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isSpinning, winner, isMuted]);

  const handleSpin = () => {
    if (!isSpinning && users.length > 0 && isAdmin) {
      // Reset rotation to start fresh
      setRotation(0);
      onSpin();
    }
  };

  // Calculate number of segments based on user count
  const segments = Math.min(Math.max(users.length, 8), 16);
  const segmentAngle = 360 / segments;

  // Color palette for segments
  const segmentColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-8 ">
      {showConfetti && (
        <Confetti
          width={windowWidth}
          height={windowHeight}
          recycle={false}
          numberOfPieces={300}
          gravity={0.1}
          wind={0}
          initialVelocityX={3}
          initialVelocityY={10}
          tweenDuration={5000}
          colors={[
            "#3B82F6",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#8B5CF6",
            "#EC4899",
            "#06B6D4",
            "#84CC16",
          ]}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1000,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Audio Controls */}
      <div className="absolute top-4 right-4">
        <Button
          onClick={toggleMute}
          variant="ghost"
          size="sm"
          className="rounded-full w-10 h-10 p-0"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Spinner Circle */}
      <div className="relative w-96 h-96 md:h-[500px] md:w-[500px] flex items-center justify-center ">
        {/* Outer decorative rings */}
        <div className="absolute inset-0 rounded-full border-8 border-gradient-to-r from-blue-400/30 to-purple-400/30 animate-pulse" />
        <div className="absolute inset-4 rounded-full border-4 border-gradient-to-r from-blue-300/20 to-purple-300/20" />

        {/* Glowing effect */}
        {isSpinning && (
          <div className="absolute inset-[-10px] rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl animate-pulse" />
        )}

        {/* Main spinner */}
        <motion.div
          className="relative w-80 h-80 md:h-[450px] md:w-[450px]  rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-8 border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden"
          animate={{
            rotate: rotation,
            scale: isSpinning ? 1.05 : 1,
          }}
          transition={{
            type: "tween",
            ease: isSpinning ? "linear" : [0.68, -0.55, 0.265, 1.55],
            duration: isSpinning ? 0.08 : 0.8,
          }}
        >
          {/* Segments background */}
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: segments }).map((_, index) => {
              const colorIndex = index % segmentColors.length;

              return (
                <div
                  key={`segment-${index}`}
                  className="absolute origin-center"
                  style={{
                    width: "160px",
                    height: "160px",
                    top: "50%",
                    left: "50%",
                    transform: `
            translate(-50%, -50%)
            rotate(${segmentAngle * index}deg)
          `,
                    clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
                    backgroundColor: isSpinning
                      ? segmentColors[
                          (colorIndex + Math.floor(rotation / 45)) %
                            segmentColors.length
                        ] + "40"
                      : segmentColors[colorIndex] + "30",
                    transition: "background-color 0.3s ease",
                  }}
                />
              );
            })}
          </div>

          {/* Center content */}
          <div className="relative z-20 text-center" style={{
    transform: `rotate(${-rotation}deg)`
  }}>
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
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
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
                  <div className="mt-2 text-xs text-blue-300">
                    {Math.ceil(
                      spinDuration / 1000 -
                        (isSpinning ? (Date.now() - isSpinning) / 1000 : 0),
                    )}
                    s
                  </div>
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
                  {/* <p className="text-sm font-medium text-muted-foreground">
                    Participants Ready
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Click spin to start
                  </p> */}
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
      </div>

      {/* Spin Button - Admin Only */}
      {isAdmin && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                    animate={{ width: ["0%", "100%", "0%"] }}
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
                Congratulations <span className="font-bold">{winner.name}</span>
                ! 🎉 Winner selected!
              </p>
            </>
          ) : (
            <>
              <Target className="w-4 h-4 text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-400">
                {users.length} participant{users.length !== 1 ? "s" : ""} ready
                to spin!
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DiceSpinner;

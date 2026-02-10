import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import api from "../services/api";
import DiceSpinner from "../components/DiceSpinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Trophy, Users, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const UserView = () => {
  const { user } = useAuth();
  const { socket, connectToSession } = useSocket();

  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [latestWinner, setLatestWinner] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // In a real app, you'd get session ID from user context or API
    fetchUserData();
  }, []);

  useEffect(() => {
    if (sessionId && socket) {
      connectToSession(sessionId);
      socket.on("spin_result", handleSpinResult);
      return () => {
        socket.off("spin_result");
      };
    }
  }, [sessionId, socket]);

  const fetchUserData = async () => {
    try {
      // This would come from your API based on user's session
      const response = await api.get("/user/session");
      setSessionId(response.data.session_id);
      setRegisteredUsers(response.data.users);
      setSelectedUsers(response.data.selected);
    } catch (error) {
      console.error("Failed to fetch user data");
    }
  };

  const handleSpinResult = (data) => {
  // Remove setIsSpinning(true) and setTimeout
  setLatestWinner(data.winner);

  const newSelected = {
    id: Date.now(),
    name: data.winner.name,
    koc_id: data.winner.koc_id,
    created_at: data.timestamp,
  };
  setSelectedUsers((prev) => [newSelected, ...prev]);
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Live Event Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user?.name || "Participant"}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold">
                {registeredUsers.length} Participants
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-center">Live Dice Roll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {isSpinning && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-lg font-semibold animate-pulse">
                        Rolling...
                      </p>
                    </div>
                  </div>
                )}
                <DiceSpinner
                  users={registeredUsers}
                  onSpin={() => {}}
                  isSpinning={isSpinning}
                  winner={latestWinner}
                  isAdmin={false}
                />
              </div>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    Waiting for next roll...
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Winners */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Selected Winners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {selectedUsers.map((winner, index) => (
                    <motion.div
                      key={winner.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative p-4 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
                    >
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="ml-10">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <p className="font-bold text-lg">{winner.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {winner.koc_id}
                        </p>
                        
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {selectedUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No winners selected yet
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserView;

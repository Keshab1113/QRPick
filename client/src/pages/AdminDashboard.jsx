import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Download,
  QrCode,
  UserPlus,
  Clock,
  Copy,
  Check,
  Trophy,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import api from "../services/api";
import toast from "react-hot-toast";
import DiceSpinner from "../components/DiceSpinner";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { socket, connectToSession } = useSocket();
  const navigate = useNavigate();

  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [latestWinner, setLatestWinner] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleNewUser = (newUser) => {
    setRegisteredUsers((prev) => [newUser, ...prev]);
    toast.success(`${newUser.name} just joined!`, { icon: "👋" });
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get("/qr/sessions");
      setSessions(response.data);
      if (response.data.length > 0 && !activeSession) {
        setActiveSession(response.data[0]);
      }
    } catch (error) {
      toast.error("Failed to fetch sessions");
    }
  };

  const fetchRegisteredUsers = async () => {
    if (!activeSession) return;
    try {
      const response = await api.get(`/session/${activeSession.id}/users`);
      setRegisteredUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch users");
    }
  };

  const handleGenerateQR = async () => {
    try {
      const response = await api.post("/qr/generate");
      setSessions((prev) => [response.data, ...prev]);
      setActiveSession(response.data);
      toast.success("QR Code generated successfully");
    } catch (error) {
      toast.error("Failed to generate QR code");
    }
  };

  const handleSpin = async () => {
    if (!activeSession) {
      toast.error("Please create a session first");
      return;
    }

    setIsSpinning(true);
    try {
      await api.post(`/session/${activeSession.id}/spin`);
      // Result will come via socket
    } catch (error) {
      toast.error("Spin failed");
      setIsSpinning(false);
    }
  };
  const handleSpinResult = (data) => {
    setTimeout(() => {
      setIsSpinning(false);
      setLatestWinner(data.winner);

      const newSelected = {
        id: Date.now(),
        name: data.winner.name,
        koc_id: data.winner.koc_id,
        team: data.winner.team,
        created_at: data.timestamp,
      };

      // Add winner to selected users AT THE END (for chronological order)
      setSelectedUsers((prev) => [...prev, newSelected]);

      // Remove winner from registered users
      setRegisteredUsers((prev) =>
        prev.filter((user) => user.id !== data.winner.id),
      );

      toast.success(`Winner: ${data.winner.name}`, {
        icon: "🎉",
        duration: 5000,
      });
    }, 3000);
  };

  // Also update the fetchSelectedUsers function to ensure proper ordering:
  const fetchSelectedUsers = async () => {
    if (!activeSession) return;
    try {
      const response = await api.get(`/session/${activeSession.id}/selected`);
      // Sort by created_at in ascending order (oldest first)
      const sortedSelected = response.data.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
      setSelectedUsers(sortedSelected);

      // Remove selected users from registered users list
      const selectedIds = response.data.map((user) => user.id);
      setRegisteredUsers((prev) =>
        prev.filter((user) => !selectedIds.includes(user.id)),
      );
    } catch (error) {
      toast.error("Failed to fetch selected users");
    }
  };

  const handleExport = async () => {
    if (!activeSession) return;

    try {
      const response = await api.get(`/session/${activeSession.id}/export`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `selected_users_${activeSession.id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Exported successfully");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSession) {
      fetchRegisteredUsers();
      fetchSelectedUsers();
      connectToSession(activeSession.id);

      if (socket) {
        socket.on("spin_result", handleSpinResult);
        socket.on("new_user", handleNewUser);

        return () => {
          socket.off("spin_result");
          socket.off("new_user");
        };
      }
    }
  }, [activeSession, socket]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🎲 Dice Spinner Admin
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user?.name || "Admin"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleGenerateQR}
                className="flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Generate QR
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Session Selector */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Active Session</CardTitle>
            </CardHeader>
            <CardContent>
              {activeSession ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Session ID: {activeSession.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created:{" "}
                        {new Date(
                          activeSession.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(activeSession.public_url)}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy Registration Link
                    </Button>
                  </div>

                  {activeSession.qr_code && (
                    <div className="flex items-start gap-6">
                      <img
                        src={activeSession.qr_code}
                        alt="QR Code"
                        className="w-32 h-32 border rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium mb-2">Registration Link:</h4>
                        <p className="text-sm text-muted-foreground break-all">
                          {activeSession.public_url}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No active session. Generate a QR code to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Registered Users */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Registered Users</span>
                <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-1 rounded">
                  {registeredUsers.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                <AnimatePresence>
                  {registeredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          KOC: {user.koc_id} • {user.team}
                        </p>
                      </div>
                      <UserPlus className="w-4 h-4 text-green-500" />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {registeredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No users registered yet
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Center Panel - Dice Spinner */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-center">Dice Spinner</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <DiceSpinner
                users={registeredUsers}
                onSpin={handleSpin}
                isSpinning={isSpinning}
                winner={latestWinner}
                isAdmin={true}
              />
            </CardContent>
          </Card>

          {/* Right Panel - Selected Users */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Selected Winners</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={selectedUsers.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                <AnimatePresence>
                  {selectedUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <p className="font-medium">{user.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          KOC: {user.koc_id} • {user.team}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(user.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        #{index + 1}{" "}
                        {/* This will now show correct chronological order */}
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

export default AdminDashboard;

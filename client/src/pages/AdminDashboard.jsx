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
  Users,
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
    // Only add if not already selected
    const isAlreadySelected = selectedUsers.some(
      (u) => u.user_id === newUser.id,
    );
    if (!isAlreadySelected) {
      setRegisteredUsers((prev) => [newUser, ...prev]);
      toast.success(`${newUser.name} just joined!`, { icon: "👋" });
    }
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
      // This now returns only users who haven't been selected
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

    if (registeredUsers.length === 0) {
      toast.error("No users available to spin!");
      return;
    }

    setIsSpinning(true);
    try {
      const response = await api.post(`/session/${activeSession.id}/spin`);
      if (response.data.success) {
        toast.success("Spinning wheel started!");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Spin failed";
      toast.error(errorMsg);
      setIsSpinning(false);
    }
  };

  const handleSpinResult = (data) => {
    // Remove setTimeout - result already delayed by backend
    setIsSpinning(false);
    setLatestWinner(data.winner);

    // Immediately remove winner from registered users
    setRegisteredUsers((prev) =>
      prev.filter((user) => user.id !== data.winner.id),
    );

    // Add winner to selected users at the END (chronological order)
    const newSelected = {
      id: Date.now(),
      user_id: data.winner.id,
      name: data.winner.name,
      koc_id: data.winner.koc_id,
      team: data.winner.team,
      created_at: data.timestamp,
    };

    setSelectedUsers((prev) => [...prev, newSelected]);

    toast.success(`🎉 Winner: ${data.winner.name}`, {
      duration: 6000,
    });
  };

  const fetchSelectedUsers = async () => {
    if (!activeSession) return;
    try {
      const response = await api.get(`/session/${activeSession.id}/selected`);
      // Already sorted by created_at ASC from backend
      setSelectedUsers(response.data);
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

  const handleExportRegistered = async () => {
    if (!activeSession) return;

    try {
      const response = await api.get(
        `/session/${activeSession.id}/export-registered`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `registered_users_${activeSession.id}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Exported successfully");
    } catch (error) {
      toast.error("Export failed");
    }
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
                Drilling Group (N&WK)
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user?.name || "Admin"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.open("/admin/qr-sessions", "_blank")}
                className="flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Show QR
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
        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel - Registered Users */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Available Users</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-1 rounded">
                    {registeredUsers.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportRegistered}
                    disabled={registeredUsers.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
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
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.team}
                        </p>
                      </div>
                      <UserPlus className="w-4 h-4 text-green-500" />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {registeredUsers.length === 0 && selectedUsers.length > 0 && (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      All users have been selected!
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedUsers.length} winner
                      {selectedUsers.length !== 1 ? "s" : ""} selected
                    </p>
                  </div>
                )}

                {registeredUsers.length === 0 && selectedUsers.length === 0 && (
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
          <Card className="lg:col-span-2">
            <CardContent className="pt-4 ">
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
                          {user.team}
                        </p>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        #{index + 1}
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
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Available for Spin
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {registeredUsers.length}
                  </p>
                </div>
                <Users className="w-12 h-12 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Already Selected
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {selectedUsers.length}
                  </p>
                </div>
                <Trophy className="w-12 h-12 text-green-600/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Registered
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {registeredUsers.length + selectedUsers.length}
                  </p>
                </div>
                <UserPlus className="w-12 h-12 text-blue-600/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

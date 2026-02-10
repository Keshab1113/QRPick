import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Copy, Check, Clock, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const QRSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [copiedSessionId, setCopiedSessionId] = useState(null);
  const [showOtherSessions, setShowOtherSessions] = useState(false);

  const fetchSessions = async () => {
    try {
      const response = await api.get("/qr/sessions");
      setSessions(response.data);
    } catch (error) {
      toast.error("Failed to fetch sessions");
    }
  };

  const handleGenerateQR = async () => {
    try {
      const response = await api.post("/qr/generate");
      // Add the new session to the beginning of the array
      setSessions((prev) => [response.data, ...prev]);
      toast.success("QR Code generated successfully");
    } catch (error) {
      toast.error("Failed to generate QR code");
    }
  };

  const copyToClipboard = (text, sessionId) => {
    navigator.clipboard.writeText(text);
    setCopiedSessionId(sessionId);
    setTimeout(() => setCopiedSessionId(null), 2000);
    toast.success("Copied to clipboard");
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    
    try {
      await api.delete(`/qr/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success("Session deleted successfully");
    } catch (error) {
      toast.error("Failed to delete session");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Get active session (first one) and other sessions
  const activeSession = sessions.length > 0 ? sessions[0] : null;
  const otherSessions = sessions.slice(1);

  const SessionCard = ({ session, isActive = false }) => (
    <Card className={`hover:shadow-lg transition-shadow ${isActive ? 'border-primary border-2' : ''}`}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>Session #{session.id}</span>
            {isActive && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteSession(session.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-center">
            <img
              src={session.qr_code}
              alt="QR Code"
              className="w-48 h-48 border rounded-lg"
            />
          </div>
          
          <div className="space-y-2">
            
            
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">Registration Link:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={session.public_url}
                  className="flex-1 text-sm px-2 py-1 border rounded bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(session.public_url, session.id)}
                  className="flex items-center gap-1"
                >
                  {copiedSessionId === session.id ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  Copy
                </Button>
              </div>
            </div>
            
            
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              QR Sessions Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all your active QR sessions
            </p>
          </div>
          <Button
            onClick={handleGenerateQR}
            className="flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Generate New QR
          </Button>
        </div>

        {/* Active Session */}
        {activeSession && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Active Session
            </h2>
            <div className="max-w-md mx-auto">
              <SessionCard session={activeSession} isActive={true} />
            </div>
          </div>
        )}

        {/* Other Sessions Toggle */}
        {otherSessions.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-center mb-4">
              <Button
                variant="outline"
                onClick={() => setShowOtherSessions(!showOtherSessions)}
                className="flex items-center gap-2"
              >
                {showOtherSessions ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide Other Sessions ({otherSessions.length})
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show Other Sessions ({otherSessions.length})
                  </>
                )}
              </Button>
            </div>

            {showOtherSessions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Other Sessions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* No Sessions State */}
        {sessions.length === 0 && (
          <div className="text-center py-16">
            <QrCode className="w-24 h-24 mx-auto text-gray-400 mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Active Sessions
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Generate a QR code to create your first session
            </p>
            <Button
              onClick={handleGenerateQR}
              className="flex items-center gap-2 mx-auto"
            >
              <QrCode className="w-4 h-4" />
              Generate Your First QR
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRSessions;
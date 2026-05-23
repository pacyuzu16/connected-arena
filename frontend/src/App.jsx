import { useState, useEffect } from "react";
import { CSS } from "./utils/styles";
import useWebSocket from "./hooks/useWebSocket";
import JoinScreen from "./components/JoinScreen";
import MatchFeed from "./components/MatchFeed";
import Leaderboard from "./components/Leaderboard";
import CommentaryBar from "./components/CommentaryBar";
import PredictionModal from "./components/PredictionModal";

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined]         = useState(false);

  // Inject global styles once
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const {
    connected,
    events,
    leaderboard,
    commentary,
    prediction,
    myScore,
    predCountdown,
    connect,
    sendPrediction,
  } = useWebSocket(playerName);

  const handleJoin = (name, persona) => {
    setPlayerName(name);
    setJoined(true);
    connect(name, persona);
  };

  if (!joined) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-logo"><span>🏟️</span><span>Connected Arena</span></div>
        <div className="hdr-score">⭐ {myScore} pts</div>
        <div className={`status ${connected ? "live" : "offline"}`}>
          <div className={`dot ${connected ? "live" : "offline"}`} />
          {connected ? "LIVE" : "OFFLINE"}
        </div>
      </header>

      <div className="main">
        <MatchFeed events={events} />
        <Leaderboard players={leaderboard} currentPlayerName={playerName} />
      </div>

      <CommentaryBar commentary={commentary} />
      <PredictionModal
        prediction={prediction}
        countdown={predCountdown}
        onAnswer={sendPrediction}
      />
    </div>
  );
}

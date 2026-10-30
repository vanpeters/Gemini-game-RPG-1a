import React, { useState } from 'react';
import { NetworkPeer } from '../types/rpg';
import { Users, Wifi, Copy, Check, Shield, Globe, Radio, Play, Share2 } from 'lucide-react';
import { lanMultiplayer } from '../services/lanMultiplayer';

interface LanMultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  peers: NetworkPeer[];
  roomCode: string;
  isHost: boolean;
  ping: number;
  onJoinRoom: (newRoomCode: string, asHost: boolean) => void;
}

export const LanMultiplayerModal: React.FC<LanMultiplayerModalProps> = ({
  isOpen,
  onClose,
  peers,
  roomCode,
  isHost,
  ping,
  onJoinRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'lobby' | 'webrtc'>('lobby');
  const [inputCode, setInputCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOffer, setCopiedOffer] = useState(false);
  const [webrtcOfferStr, setWebrtcOfferStr] = useState('');
  const [webrtcAnswerInput, setWebrtcAnswerInput] = useState('');
  const [webrtcStatus, setWebrtcStatus] = useState<string>('');

  if (!isOpen) return null;

  const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleHostNewRoom = () => {
    const randomCode = 'VALDOR-' + Math.floor(100 + Math.random() * 900);
    onJoinRoom(randomCode, true);
  };

  const handleJoinCustomCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    onJoinRoom(inputCode.trim().toUpperCase(), false);
    setInputCode('');
  };

  const handleGenerateOffer = async () => {
    try {
      setWebrtcStatus('Generating P2P WebRTC Offer token...');
      const offer = await lanMultiplayer.createWebRtcOffer();
      setWebrtcOfferStr(offer);
      setWebrtcStatus('Offer generated! Share this token with a player on your local network.');
    } catch (e: any) {
      setWebrtcStatus('Error generating offer: ' + e.message);
    }
  };

  const handleAcceptOffer = async () => {
    try {
      if (!webrtcAnswerInput.trim()) return;
      setWebrtcStatus('Accepting Offer and establishing P2P DataChannel...');
      const answer = await lanMultiplayer.acceptWebRtcOffer(webrtcAnswerInput.trim());
      setWebrtcOfferStr(answer);
      setWebrtcStatus('Answer generated! Handshake complete.');
    } catch (e: any) {
      setWebrtcStatus('Handshake failed: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-500 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3.5 border-b border-amber-600/50">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-amber-300 uppercase tracking-wide">
              LAN Co-Op Multiplayer Lobby
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-0.5 rounded hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-950/60 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition ${
              activeTab === 'lobby' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>LAN Broadcast Lobby ({peers.length + 1} Players)</span>
          </button>
          <button
            onClick={() => setActiveTab('webrtc')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 transition ${
              activeTab === 'webrtc' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Direct P2P WebRTC Token</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-5">
          {activeTab === 'lobby' ? (
            <>
              {/* Room Status Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Current Room Code</div>
                    <div className="text-xl font-black text-amber-400 font-mono">{roomCode}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500 rounded text-emerald-400 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      {isHost ? 'World Host' : 'Joined Peer'}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">LAN Latency: ~{ping}ms</div>
                  </div>
                </div>

                {/* Direct Share Link */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="flex-1 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-xs text-slate-300 font-mono select-all outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded transition flex items-center gap-1.5"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Host / Join Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Host button */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">Host New World</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Generate a fresh LAN session room and act as the world host for monsters and items.
                    </p>
                  </div>
                  <button
                    onClick={handleHostNewRoom}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Create & Host Room</span>
                  </button>
                </div>

                {/* Join code input */}
                <form
                  onSubmit={handleJoinCustomCode}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between gap-3"
                >
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">Join Existing Room</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the room code shared by your friend on the same local network.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. VALDOR-500"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-xs text-white uppercase font-mono outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition"
                    >
                      Join
                    </button>
                  </div>
                </form>
              </div>

              {/* Connected Party Members List */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3 flex items-center justify-between">
                  <span>Connected Party Members</span>
                  <span className="text-amber-400">{peers.length + 1} Adventurers</span>
                </h3>

                <div className="space-y-2">
                  {/* Local player entry */}
                  <div className="flex items-center justify-between bg-slate-900/90 border border-amber-500/50 rounded-md p-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">🛡️</span>
                      <div>
                        <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                          <span>You (Local Hero)</span>
                          {isHost && (
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 rounded">
                              HOST
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">Broadcasting on LAN channel</div>
                      </div>
                    </div>
                    <span className="text-emerald-400 text-xs font-mono font-bold">Online</span>
                  </div>

                  {/* Remote peers */}
                  {peers.map((peer) => (
                    <div
                      key={peer.id}
                      className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-md p-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{peer.sprite}</span>
                        <div>
                          <div className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                            <span>{peer.name}</span>
                            <span className="text-[10px] text-slate-400">Lv.{peer.level} {peer.className}</span>
                            {peer.isHost && (
                              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 rounded">
                                HOST
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Location: ({Math.round(peer.x)}, {Math.round(peer.y)}) • HP: {peer.hp}/{peer.maxHp}
                          </div>
                        </div>
                      </div>
                      <span className="text-sky-400 text-xs font-mono font-bold">P2P Synced</span>
                    </div>
                  ))}

                  {peers.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-500 italic">
                      No other players detected yet. Open a second browser window or share the room code with someone on your local network to explore together!
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Direct WebRTC Offer / Answer Pairing for Cross-Device Wi-Fi */
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h3 className="font-bold text-sm text-slate-200 mb-1">Cross-Device WebRTC P2P Pairing</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  For devices on separate physical machines (e.g., laptop and phone on the same Wi-Fi), you can establish a direct WebRTC DataChannel connection without any external relay servers.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">Step 1: Host generates Offer</span>
                    <button
                      onClick={handleGenerateOffer}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded transition"
                    >
                      Generate Offer Token
                    </button>
                  </div>

                  {webrtcOfferStr && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-400">P2P Token (Click to copy):</div>
                      <textarea
                        readOnly
                        value={webrtcOfferStr}
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        className="w-full h-20 bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono text-cyan-300 resize-none outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(webrtcOfferStr);
                          setCopiedOffer(true);
                          setTimeout(() => setCopiedOffer(false), 2000);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded flex items-center gap-1.5"
                      >
                        {copiedOffer ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedOffer ? 'Token Copied!' : 'Copy Token'}</span>
                      </button>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800">
                    <span className="text-xs font-bold text-amber-300 block mb-1.5">
                      Step 2: Client pastes Offer to establish connection
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste P2P Token here..."
                        value={webrtcAnswerInput}
                        onChange={(e) => setWebrtcAnswerInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-xs text-white font-mono outline-none"
                      />
                      <button
                        onClick={handleAcceptOffer}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition"
                      >
                        Pair
                      </button>
                    </div>
                  </div>

                  {webrtcStatus && (
                    <div className="text-xs text-amber-300 font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
                      {webrtcStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3 border-t border-slate-800 text-xs">
          <div className="text-slate-400">
            Powered by Browser-Native BroadcastChannel & WebRTC
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

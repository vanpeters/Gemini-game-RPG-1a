import { NetworkPeer, MultiplayerMessage, ChatMessage, WorldMonster } from '../types/rpg';

type MessageHandler = (msg: MultiplayerMessage) => void;

class LanMultiplayerService {
  private peerId: string;
  private roomCode: string = 'VALDOR-LAN';
  private isHost: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private rtcConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private messageHandlers: Set<MessageHandler> = new Set();
  private peers: Map<string, NetworkPeer> = new Map();
  private isConnected: boolean = false;
  private ping: number = 2;

  constructor() {
    this.peerId = 'peer_' + Math.random().toString(36).substring(2, 9);
  }

  public getPeerId(): string {
    return this.peerId;
  }

  public getRoomCode(): string {
    return this.roomCode;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getPeers(): NetworkPeer[] {
    return Array.from(this.peers.values());
  }

  public getPing(): number {
    return this.ping;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Connect to LAN session using BroadcastChannel and optional WebRTC
   */
  public connect(roomCode: string = 'VALDOR-LAN', asHost: boolean = false) {
    this.roomCode = roomCode.toUpperCase().trim();
    this.isHost = asHost;
    this.disconnect();

    const channelName = `valdor_rpg_${this.roomCode}`;
    try {
      this.broadcastChannel = new BroadcastChannel(channelName);
      this.broadcastChannel.onmessage = (event) => {
        this.handleIncomingRaw(event.data);
      };
      this.isConnected = true;
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment:', e);
    }

    // Ping loop
    setInterval(() => {
      this.ping = Math.floor(Math.random() * 4) + 1; // Simulated direct LAN latency (1-4ms)
      this.pruneStalePeers();
    }, 3000);
  }

  public disconnect() {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }

    for (const [_, pc] of this.rtcConnections) {
      try {
        pc.close();
      } catch {}
    }
    this.rtcConnections.clear();
    this.dataChannels.clear();
    this.peers.clear();
    this.isConnected = false;
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Broadcast a message to all connected LAN peers
   */
  public broadcast(type: MultiplayerMessage['type'], payload: any, senderName: string = 'Player') {
    const message: MultiplayerMessage = {
      type,
      senderId: this.peerId,
      senderName,
      payload,
      timestamp: Date.now(),
    };

    // 1. Send over BroadcastChannel (for local tabs/windows)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (err) {
        console.warn('Failed to broadcast via channel:', err);
      }
    }

    // 2. Send over open WebRTC DataChannels (for cross-device LAN)
    const json = JSON.stringify(message);
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        try {
          dc.send(json);
        } catch {}
      }
    });
  }

  /**
   * Heartbeat to announce player position and status to LAN peers
   */
  public sendHeartbeat(playerState: {
    name: string;
    className: string;
    styleId: string;
    sprite: string;
    x: number;
    y: number;
    direction: 'up' | 'down' | 'left' | 'right';
    isMoving: boolean;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    level: number;
  }) {
    this.broadcast(
      'HEARTBEAT',
      {
        ...playerState,
        isHost: this.isHost,
      },
      playerState.name
    );
  }

  /**
   * Notify peers of combat attack action
   */
  public sendAttackAction(action: 'attack' | 'fireball' | 'thunder' | 'heal', targetPos?: { x: number; y: number }) {
    this.broadcast('ATTACK', {
      action,
      targetPos,
    });
  }

  /**
   * Send party chat
   */
  public sendChatMessage(senderName: string, text: string) {
    this.broadcast(
      'CHAT',
      {
        id: 'msg_' + Math.random().toString(36).substring(2, 9),
        senderName,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
      },
      senderName
    );
  }

  /**
   * Host syncs open-world mobs to non-host peers
   */
  public syncWorldMobs(mobs: WorldMonster[]) {
    if (!this.isHost) return;
    this.broadcast('MOB_STATE_SYNC', {
      mobs: mobs.map((m) => ({
        instanceId: m.instanceId,
        x: m.x,
        y: m.y,
        hp: m.hp,
        maxHp: m.maxHp,
        state: m.state,
        targetPlayerId: m.targetPlayerId,
        isDefending: m.isDefending,
      })),
    });
  }

  /**
   * Peer damages a world mob
   */
  public notifyMobHit(instanceId: string, damage: number, attackerName: string) {
    this.broadcast('MOB_HIT', {
      instanceId,
      damage,
      attackerName,
    });
  }

  private handleIncomingRaw(data: any) {
    let msg: MultiplayerMessage;
    if (typeof data === 'string') {
      try {
        msg = JSON.parse(data);
      } catch {
        return;
      }
    } else {
      msg = data as MultiplayerMessage;
    }

    if (!msg || msg.senderId === this.peerId) {
      return; // Ignore own messages
    }

    // Process internal peer tracking
    if (msg.type === 'HEARTBEAT') {
      const p = msg.payload;
      this.peers.set(msg.senderId, {
        id: msg.senderId,
        name: p.name || msg.senderName,
        className: p.className || 'Adventurer',
        styleId: p.styleId || 'knight',
        sprite: p.sprite || '🛡️',
        x: p.x ?? 20,
        y: p.y ?? 20,
        direction: p.direction || 'down',
        isMoving: Boolean(p.isMoving),
        hp: p.hp ?? 100,
        maxHp: p.maxHp ?? 100,
        mana: p.mana ?? 50,
        maxMana: p.maxMana ?? 50,
        level: p.level ?? 1,
        isHost: Boolean(p.isHost),
        lastSeen: Date.now(),
      });
    } else if (msg.type === 'ATTACK') {
      const peer = this.peers.get(msg.senderId);
      if (peer) {
        peer.lastAttackAction = {
          type: msg.payload.action,
          time: Date.now(),
        };
      }
    } else if (msg.type === 'LEAVE') {
      this.peers.delete(msg.senderId);
    }

    // Forward to subscribers
    this.messageHandlers.forEach((handler) => {
      try {
        handler(msg);
      } catch (err) {
        console.error('Error in message handler:', err);
      }
    });
  }

  private pruneStalePeers() {
    const now = Date.now();
    for (const [id, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > 8000) {
        this.peers.delete(id);
      }
    }
  }

  /**
   * Helper to create WebRTC Offer for cross-device LAN multiplayer
   */
  public async createWebRtcOffer(): Promise<string> {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    const dc = pc.createDataChannel('valdor-lan-data');
    this.setupDataChannel(dc, 'remote_peer');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for ICE gathering to complete for full standalone SDP string
    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        const checkState = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', checkState);
        setTimeout(resolve, 1500); // 1.5s timeout fallback
      }
    });

    return btoa(JSON.stringify(pc.localDescription));
  }

  /**
   * Helper to accept WebRTC Offer and generate Answer
   */
  public async acceptWebRtcOffer(offerB64: string): Promise<string> {
    const offerObj = JSON.parse(atob(offerB64));
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, 'host_peer');
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offerObj));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        const checkState = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        pc.addEventListener('icegatheringstatechange', checkState);
        setTimeout(resolve, 1500);
      }
    });

    return btoa(JSON.stringify(pc.localDescription));
  }

  private setupDataChannel(dc: RTCDataChannel, peerId: string) {
    dc.onopen = () => {
      this.dataChannels.set(peerId, dc);
    };
    dc.onclose = () => {
      this.dataChannels.delete(peerId);
    };
    dc.onmessage = (event) => {
      this.handleIncomingRaw(event.data);
    };
  }
}

export const lanMultiplayer = new LanMultiplayerService();

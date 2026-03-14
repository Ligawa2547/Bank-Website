// WebRTC Signaling Utilities for Support Module

import type { WebSocket } from 'ws'

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'ready'
  callId: string
  from: string
  to?: string
  data?: any
  timestamp: number
}

export interface PeerConnection {
  callId: string
  initiatorId: string
  peerId: string
  socket?: WebSocket
  connected: boolean
  createdAt: Date
}

export class SignalingServer {
  private peers: Map<string, PeerConnection> = new Map()
  private calls: Map<string, Set<string>> = new Map() // callId -> set of peer IDs

  joinCall(callId: string, peerId: string): PeerConnection {
    const connection: PeerConnection = {
      callId,
      initiatorId: peerId,
      peerId,
      connected: false,
      createdAt: new Date(),
    }

    if (!this.calls.has(callId)) {
      this.calls.set(callId, new Set())
    }
    this.calls.get(callId)!.add(peerId)
    this.peers.set(`${callId}:${peerId}`, connection)

    return connection
  }

  leaveCall(callId: string, peerId: string): void {
    this.peers.delete(`${callId}:${peerId}`)
    const callPeers = this.calls.get(callId)
    if (callPeers) {
      callPeers.delete(peerId)
      if (callPeers.size === 0) {
        this.calls.delete(callId)
      }
    }
  }

  getPeersInCall(callId: string): PeerConnection[] {
    const callPeers = this.calls.get(callId) || new Set()
    return Array.from(callPeers)
      .map((peerId) => this.peers.get(`${callId}:${peerId}`))
      .filter((peer): peer is PeerConnection => peer !== undefined)
  }

  getCallConnections(callId: string): Map<string, PeerConnection> {
    const connections = new Map<string, PeerConnection>()
    const callPeers = this.calls.get(callId) || new Set()
    callPeers.forEach((peerId) => {
      const key = `${callId}:${peerId}`
      const connection = this.peers.get(key)
      if (connection) {
        connections.set(peerId, connection)
      }
    })
    return connections
  }

  broadcastMessage(callId: string, message: SignalingMessage, excludePeerId?: string): void {
    const peers = this.getPeersInCall(callId)
    peers.forEach((peer) => {
      if (excludePeerId && peer.peerId === excludePeerId) return
      if (peer.socket && peer.socket.readyState === 1) {
        // WebSocket.OPEN
        peer.socket.send(JSON.stringify(message))
      }
    })
  }

  sendMessage(callId: string, fromPeerId: string, toPeerId: string, message: SignalingMessage): boolean {
    const key = `${callId}:${toPeerId}`
    const peer = this.peers.get(key)
    if (peer && peer.socket && peer.socket.readyState === 1) {
      peer.socket.send(JSON.stringify(message))
      return true
    }
    return false
  }

  cleanup(): void {
    this.peers.clear()
    this.calls.clear()
  }
}

export const signalingServer = new SignalingServer()

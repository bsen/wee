"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Connecting...");
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isInitiatorRef = useRef(false);

  useEffect(() => {
    init();

    return () => {
      cleanup();
    };
  }, []);

  async function init() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      connectToServer();
    } catch (error: any) {
      setStatus(`Camera/mic error: ${error.message}`);
    }
  }

  function connectToServer() {
    socketRef.current = new WebSocket("ws://35.154.45.251:8080");

    socketRef.current.onopen = () => {
      setStatus("Waiting for another person...");
    };

    socketRef.current.onmessage = handleMessage;

    socketRef.current.onclose = () => {
      setStatus("Disconnected. Refresh to reconnect.");
      cleanup();
    };
  }

  function handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "connection":
        isInitiatorRef.current = data.id === 0;
        break;

      case "ready":
        setStatus("Another person joined. Starting call...");
        startCall();
        break;

      case "offer":
        handleOffer(data);
        break;

      case "answer":
        if (peerConnectionRef.current) {
          peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.sdp)
          );
        }
        break;

      case "ice-candidate":
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
        break;

      case "disconnected":
        setStatus("Other person left. Waiting for someone new...");
        setShowPlaceholder(true);
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        }
        break;
    }
  }

  async function startCall() {
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (localStreamRef.current && peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(track, localStreamRef.current);
        }
      });
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = (event) => {
        if (event.streams[0] && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setShowPlaceholder(false);
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: event.candidate,
            })
          );
        }
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        if (
          peerConnectionRef.current &&
          peerConnectionRef.current.connectionState === "connected"
        ) {
          setStatus("Connected!");
        }
      };

      if (isInitiatorRef.current) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        if (socketRef.current) {
          socketRef.current.send(
            JSON.stringify({
              type: "offer",
              sdp: peerConnectionRef.current.localDescription,
            })
          );
        }
      }
    }
  }

  async function handleOffer(data: any) {
    if (!peerConnectionRef.current) {
      startCall();
    }

    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.sdp)
      );
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      if (socketRef.current) {
        socketRef.current.send(
          JSON.stringify({
            type: "answer",
            sdp: peerConnectionRef.current.localDescription,
          })
        );
      }
    }
  }

  function cleanup() {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setShowPlaceholder(true);
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div className="relative w-full h-full">
        <div className="absolute inset-0 w-full h-full">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
          />
        </div>

        {showPlaceholder && (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black z-[2]">
            <div className="w-28 h-28 rounded-full border-2 border-neutral-600 flex items-center justify-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-14 h-14 fill-neutral-600"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div className="text-lg text-neutral-400">
              Waiting for remote user to join...
            </div>
          </div>
        )}

        <div className="absolute bottom-5 right-5 w-32 h-44 rounded-lg overflow-hidden z-[5]">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="absolute top-5 right-5 text-sm border border-neutral-800 text-neutral-400 px-4 py-2 rounded-lg z-5 max-w-64 truncate">
        {status}
      </div>
    </div>
  );
}

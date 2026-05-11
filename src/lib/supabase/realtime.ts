import { createClient } from "./client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  reactions: Record<string, string[]>;
  pinned?: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  xpTotal: number;
  streakDays: number;
  level: string;
  avatar: string;
}

const channels: Map<string, RealtimeChannel> = new Map();

export function subscribeToClassroom(
  classroomId: string,
  onMessage: (msg: ChatMessage) => void
): () => void {
  const supabase = createClient();
  const key = `classroom:${classroomId}`;

  if (channels.has(key)) channels.get(key)!.unsubscribe();

  const channel = supabase
    .channel(key)
    .on("broadcast", { event: "message" }, (payload) => {
      onMessage(payload.payload as ChatMessage);
    })
    .subscribe();

  channels.set(key, channel);
  return () => { channel.unsubscribe(); channels.delete(key); };
}

export function subscribeToLeaderboard(
  classroomId: string,
  onUpdate: (entries: LeaderboardEntry[]) => void
): () => void {
  const supabase = createClient();
  const key = `leaderboard:${classroomId}`;

  if (channels.has(key)) channels.get(key)!.unsubscribe();

  const channel = supabase
    .channel(key)
    .on("broadcast", { event: "leaderboard_update" }, (payload) => {
      onUpdate(payload.payload as LeaderboardEntry[]);
    })
    .subscribe();

  channels.set(key, channel);
  return () => { channel.unsubscribe(); channels.delete(key); };
}

export async function broadcastMessage(classroomId: string, message: ChatMessage) {
  const supabase = createClient();
  await supabase.channel(`classroom:${classroomId}`).send({
    type: "broadcast",
    event: "message",
    payload: message,
  });
}

export function unsubscribeAll() {
  channels.forEach(ch => ch.unsubscribe());
  channels.clear();
}

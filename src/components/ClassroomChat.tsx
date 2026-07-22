"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import { subscribeToClassroom } from "@/lib/supabase/realtime";
import type { ChatMessage } from "@/lib/supabase/realtime";
import { StateBlock } from "@/components/StateBlock";

interface Props {
  classroomId: string;
  currentUserId: string;
  currentUserName: string;
  isTeacher?: boolean;
}

// ClassroomChat — squelette honnête.
//
// La messagerie de classe n'est pas encore branchée : aucun message n'est
// persistant, il n'y a ni broadcast ni historique. Doctrine §B (messagerie
// à venir) et §31 (protection enfants) exigent qu'on ne montre aucune
// activité fictive. Tant que le service n'est pas opérationnel, on rend
// un StateBlock empty explicite. Le composant reste monté et abonné pour
// que le passage au service réel n'implique qu'un unique changement.
export default function ClassroomChat({ classroomId, currentUserId }: Props) {
  const locale = useLocale();
  const loc: "fr" | "en" = locale === "en" ? "en" : "fr";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const unsub = subscribeToClassroom(classroomId, (msg) => {
      if (mountedRef.current) setMessages((prev) => [...prev, msg]);
    });
    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, [classroomId]);

  void currentUserId;

  const isEmpty = messages.length === 0;

  const copy = {
    fr: {
      soul: "La messagerie de classe *arrive bientôt.*",
      body: "Aucun message n'est publié ici pour l'instant. Les annonces, devoirs et corrections de ta classe apparaîtront ici dès que la fonction sera activée.",
    },
    en: {
      soul: "The classroom feed *is coming soon.*",
      body: "Nothing is published here yet. Announcements, assignments and feedback from your class will appear here as soon as the feature is live.",
    },
  } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isEmpty ? (
          <StateBlock
            kind="empty"
            soul={copy[loc].soul}
            body={copy[loc].body}
            centered
            compact
          />
        ) : (
          <ul
            style={{
              width: "100%",
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {messages.map((m) => (
              <li
                key={m.id}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>
                  {m.userName}
                </div>
                <div>{m.content}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

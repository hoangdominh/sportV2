"use client";

import Image from "next/image";
import { useState } from "react";
import { UserRound } from "lucide-react";
import { getMemberAvatarSrc } from "@/lib/member-avatar";
import { cn } from "@/lib/utils";

export interface AvatarParticipant {
  userId: string;
  name: string;
}

export function MemberAvatar({ userId, name }: AvatarParticipant) {
  const src = getMemberAvatarSrc(userId);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const colors = ["bg-teal-400/15 text-teal-200", "bg-sky-400/15 text-sky-200", "bg-violet-400/15 text-violet-200", "bg-amber-400/15 text-amber-200"];
  const index = Array.from(userId).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0) % colors.length;
  return (
    <span role="img" aria-label={name} title={name} className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-inset ring-white/10", colors[index])}>
      {src && src !== failedSrc ? (
        <Image src={src} alt="" width={32} height={32} sizes="32px" className="h-full w-full object-cover" onError={() => setFailedSrc(src)} />
      ) : <UserRound aria-hidden="true" size={16} strokeWidth={1.7} />}
    </span>
  );
}

export function ParticipantAvatars(_props: { participants: AvatarParticipant[] }) {
  // Participant stacks are hidden; individual member avatars remain visible.
  return null;
}

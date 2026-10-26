"use client";

import { UserRound } from "lucide-react";
import { MediaImage } from "@/components/media-image";
import type { TeamMember } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full flex-col whitespace-normal rounded-none p-0 text-center hover:bg-transparent"
        >
          <span className="mx-auto flex aspect-square w-full max-w-60 items-center justify-center overflow-hidden bg-muted">
            {member.image ? (
              <MediaImage
                src={member.image}
                alt={member.name}
                className="size-full object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <UserRound className="size-12 text-muted-foreground" />
            )}
          </span>
          <span className="mt-3 font-medium">{member.name}</span>
          {member.jobTitle && (
            <span className="text-sm text-muted-foreground">{member.jobTitle}</span>
          )}
          {member.bio && (
            <span className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {member.bio}
            </span>
          )}
          <span className="sr-only">Read {member.name}&apos;s bio</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{member.name}</DialogTitle>
          {member.jobTitle && (
            <DialogDescription>{member.jobTitle}</DialogDescription>
          )}
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-[10rem_1fr] sm:items-start">
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-muted">
            {member.image ? (
              <MediaImage
                src={member.image}
                alt={member.name}
                className="size-full object-cover"
              />
            ) : (
              <UserRound className="size-12 text-muted-foreground" />
            )}
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed">
            {member.bio || "More information about this team member is coming soon."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

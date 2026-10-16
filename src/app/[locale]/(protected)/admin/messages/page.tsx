"use client";

import { api, type ContactMessage } from "@/lib/api";
import { useResource } from "@/hooks/use-resource";
import { MessagesSection } from "@/components/admin/sections/messages-section";

const fetchMessages = () => api.getContactMessages();

export default function MessagesPage() {
  const messages = useResource<ContactMessage[]>(fetchMessages, []);
  return <MessagesSection messages={messages.data} reload={messages.reload} />;
}
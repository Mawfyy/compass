import type { ChatMessage } from "../domain/chat/schemas";

export interface ChatClient {
  stream(system: string, messages: ChatMessage[]): Promise<Response>;
}

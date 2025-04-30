import { createSignal, createEffect, For, Show } from "solid-js";
import { Motion } from "solid-motionone";
import { toast } from "solid-toast";
import { useSupabase } from "solid-supabase";
import { useAuth } from "~/context/auth";

interface Message {
  id: string;
  commission_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_name?: string; // Added for display purposes
}

interface MessageChatProps {
  commissionId: string;
  adminId: string;
  adminName: string;
  userName: string;
}

export default function MessageChat(props: MessageChatProps) {
  const supabase = useSupabase();
  const auth = useAuth();
  
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [newMessage, setNewMessage] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(true);
  const [isSending, setIsSending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  
  // Scroll to bottom automatically when messages update
  let messagesEndRef: HTMLDivElement | undefined;
  
  const scrollToBottom = () => {
    messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Format date for display
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Check if current user is the admin
  const isAdmin = () => {
    return auth.user()?.id === props.adminId;
  };
  
  // Get current user ID
  const getCurrentUserId = () => {
    return auth.user()?.id || "";
  };

  // Check if message is from the current user
  const isOwnMessage = (senderId: string) => {
    return senderId === getCurrentUserId();
  };
  
  // Get name to display (either admin or user)
  const getSenderName = (senderId: string) => {
    return senderId === props.adminId ? props.adminName : props.userName;
  };
  
  // Fetch messages
  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('commission_id', props.commissionId)
        .order('created_at', { ascending: true });
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Add sender name for display
      const messagesWithNames = data.map(msg => ({
        ...msg,
        sender_name: getSenderName(msg.sender_id)
      }));
      
      setMessages(messagesWithNames);
      
      // Mark messages as read if not from the current user
      const unreadMessages = data.filter(
        msg => !msg.read && msg.sender_id !== getCurrentUserId()
      );
      
      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(msg => 
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', msg.id)
          )
        );
      }
    } catch (err: any) {
      setError(err.message);
      toast.error("Error loading messages: " + err.message);
    } finally {
      setIsLoading(false);
      
      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    }
  };
  
  // Send new message
  const sendMessage = async (e: SubmitEvent) => {
    e.preventDefault();
    
    const messageContent = newMessage().trim();
    if (!messageContent) return;
    
    setIsSending(true);
    
    try {
      const userId = getCurrentUserId();
      
      if (!userId) {
        throw new Error("You must be logged in to send messages");
      }
      
      const newMsg = {
        commission_id: props.commissionId,
        sender_id: userId,
        content: messageContent,
        read: false
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(newMsg)
        .select('*')
        .single();
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Add to messages state with sender name
      setMessages([...messages(), {
        ...data,
        sender_name: getSenderName(data.sender_id)
      }]);
      
      // Clear input
      setNewMessage("");
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      toast.error("Failed to send message: " + err.message);
    } finally {
      setIsSending(false);
    }
  };
  
  // Set up real-time subscription to new messages
  const setupMessageSubscription = () => {
    const subscription = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `commission_id=eq.${props.commissionId}`
        },
        async (payload) => {
          // Only add if not from current user (to avoid duplication)
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== getCurrentUserId()) {
            // Add sender name
            newMsg.sender_name = getSenderName(newMsg.sender_id);
            
            // Update message list
            setMessages(prev => [...prev, newMsg]);
            
            // Mark as read
            await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id);
            
            // Scroll to bottom
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  };
  
  // Load messages on component mount and set up real-time updates
  createEffect(() => {
    if (auth.isAuthenticated() && props.commissionId) {
      fetchMessages();
      const unsubscribe = setupMessageSubscription();
      
      // Cleanup on component unmount
      return unsubscribe;
    }
  });
  
  return (
    <div class="bg-gradient-to-br from-emerald-900/20 to-emerald-950/70 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-700/20 flex flex-col h-[500px]">
      {/* Header */}
      <div class="p-4 border-b border-emerald-700/30">
        <h3 class="text-lg font-medium text-emerald-100">
          Message Thread
        </h3>
        <p class="text-xs text-emerald-300/70">
          Chat with {isAdmin() ? props.userName : "our team"} about your commission
        </p>
      </div>
      
      {/* Messages Container */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <Show when={isLoading()}>
          <div class="flex justify-center py-4">
            <div class="animate-spin h-6 w-6 border-2 border-emerald-500 rounded-full border-t-transparent"></div>
          </div>
        </Show>
        
        <Show when={!isLoading() && messages().length === 0}>
          <div class="flex flex-col items-center justify-center h-full text-center p-4">
            <div class="bg-emerald-700/20 p-3 rounded-full mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
              </svg>
            </div>
            <p class="text-emerald-300/90 mb-1">No messages yet</p>
            <p class="text-xs text-emerald-400/70">
              Send a message to start the conversation
            </p>
          </div>
        </Show>
        
        <For each={messages()}>
          {(message) => {
            const isOwn = isOwnMessage(message.sender_id);
            
            return (
              <Motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                class={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  class={`max-w-[80%] rounded-lg px-4 py-2 shadow ${
                    isOwn 
                      ? 'bg-emerald-600/80 text-white rounded-br-none' 
                      : 'bg-emerald-800/50 text-emerald-100 rounded-bl-none'
                  }`}
                >
                  <div class="flex justify-between items-baseline mb-1">
                    <span class="font-medium text-xs">
                      {message.sender_name || getSenderName(message.sender_id)}
                    </span>
                    <span class="text-xs opacity-70 ml-2">
                      {formatMessageDate(message.created_at)}
                    </span>
                  </div>
                  <p class="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              </Motion.div>
            );
          }}
        </For>
        
        {/* Invisible div for scrolling to bottom */}
        <div ref={messagesEndRef}></div>
      </div>
      
      {/* Message Input */}
      <div class="p-3 border-t border-emerald-700/30">
        <form onSubmit={sendMessage} class="flex space-x-2">
          <input
            type="text"
            value={newMessage()}
            onInput={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            class="flex-1 bg-emerald-950/70 border border-emerald-700/30 focus:border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-100 placeholder:text-emerald-600/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            type="submit"
            disabled={isSending() || !newMessage().trim()}
            class="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Show
              when={!isSending()}
              fallback={
                <div class="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </Show>
          </button>
        </form>
      </div>
    </div>
  );
}
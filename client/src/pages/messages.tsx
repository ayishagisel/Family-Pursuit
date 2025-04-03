import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Message } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock current user ID for demo
const CURRENT_USER_ID = 7;

interface ConversationProps {
  selectedUserId: number | null;
  onSendMessage: (message: string) => void;
}

const Conversation = ({ selectedUserId, onSendMessage }: ConversationProps) => {
  const [newMessage, setNewMessage] = useState("");
  
  const { data: sentMessages = [] } = useQuery({
    queryKey: [`/api/messages/sent/${CURRENT_USER_ID}`],
    enabled: !!selectedUserId,
  });
  
  const { data: receivedMessages = [] } = useQuery({
    queryKey: [`/api/messages/received/${CURRENT_USER_ID}`],
    enabled: !!selectedUserId,
  });
  
  // Filter messages for the selected conversation
  const conversationMessages = [...sentMessages, ...receivedMessages]
    .filter(msg => 
      (msg.senderId === CURRENT_USER_ID && msg.receiverId === selectedUserId) ||
      (msg.senderId === selectedUserId && msg.receiverId === CURRENT_USER_ID)
    )
    .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  
  const handleSend = () => {
    if (newMessage.trim() && selectedUserId) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  if (!selectedUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-5xl text-neutral-300 dark:text-neutral-700 mb-4">
          <i className="fas fa-comments"></i>
        </div>
        <h3 className="font-medium mb-2">Your Messages</h3>
        <p className="text-sm text-neutral-500">Select a conversation to start messaging</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center mr-3">
            <i className="fas fa-user text-neutral-600"></i>
          </div>
          <div>
            <div className="font-medium">User #{selectedUserId}</div>
            <div className="text-xs text-neutral-500">Online</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {conversationMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-neutral-500">No messages yet. Send a message to start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversationMessages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.senderId === CURRENT_USER_ID ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.senderId === CURRENT_USER_ID 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-neutral-200 dark:bg-neutral-700 rounded-bl-none'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.senderId === CURRENT_USER_ID 
                      ? 'text-white/70' 
                      : 'text-neutral-500'
                  }`}>
                    {format(new Date(message.sentAt), 'h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center space-x-2">
          <Input 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={handleSend} disabled={!newMessage.trim()}>
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch users/family members for the contact list
  const { data: familyMembers = [], isLoading } = useQuery({
    queryKey: ["/api/family-members"],
  });
  
  // Filter out current user from contact list
  const contacts = familyMembers.filter(member => member.id !== CURRENT_USER_ID);
  
  const handleSendMessage = (message: string) => {
    // This would call the API to send a message in a real app
    console.log(`Sending message to ${selectedUserId}: ${message}`);
    // For now, just alert
    alert(`Message sending functionality would be implemented in a production app`);
  };

  return (
    <>
      <header className="flex justify-between items-center mb-6">
        <h1 className="font-montserrat font-bold text-2xl">Messages</h1>
        <div className="flex items-center space-x-4">
          <button className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg flex items-center">
            <i className="fas fa-edit mr-2"></i>
            <span>New Message</span>
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="family">Family</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
              </TabsList>
              
              <div className="mt-4">
                <Input placeholder="Search messages..." className="w-full" />
              </div>
            </Tabs>
          </div>
          
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-neutral-500">Loading contacts...</div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                No contacts found.
              </div>
            ) : (
              <div>
                <TabsContent value="all" className="m-0">
                  {contacts.map((contact) => (
                    <div 
                      key={contact.id}
                      className={`flex items-center p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                        selectedUserId === contact.id ? 'bg-neutral-100 dark:bg-neutral-800' : ''
                      }`}
                      onClick={() => setSelectedUserId(contact.id)}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                        <img 
                          src={contact.avatarUrl} 
                          alt={contact.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-xs text-neutral-500">{contact.role}</div>
                      </div>
                      {contact.id % 3 === 0 && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="family" className="m-0">
                  {contacts
                    .filter(contact => ["Father", "Grandfather", "Aunt", "Sister", "Step-Brother", "Cousin"].includes(contact.role))
                    .map((contact) => (
                      <div 
                        key={contact.id}
                        className={`flex items-center p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                          selectedUserId === contact.id ? 'bg-neutral-100 dark:bg-neutral-800' : ''
                        }`}
                        onClick={() => setSelectedUserId(contact.id)}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                          <img 
                            src={contact.avatarUrl} 
                            alt={contact.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-xs text-neutral-500">{contact.role}</div>
                        </div>
                      </div>
                    ))}
                </TabsContent>
                
                <TabsContent value="groups" className="m-0">
                  <div className="text-center py-8 text-neutral-500">
                    No group conversations yet.
                  </div>
                </TabsContent>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden">
          <Conversation 
            selectedUserId={selectedUserId}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </>
  );
};

export default MessagesPage;

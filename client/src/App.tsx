import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthPage from './components/Auth/AuthPage';
import Sidebar from './components/Sidebar/Sidebar';
import ChatWindow from './components/Chat/ChatWindow';
import { Conversation } from './types';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-iwa-chat">
        <div className="text-center text-iwa-subtext">
          <div className="w-12 h-12 border-2 border-iwa-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>Loading iWa...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <SocketProvider>
      <div className="flex h-full">
        <Sidebar
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
        />
        <main className="flex-1 min-w-0">
          {activeConversation ? (
            <ChatWindow key={activeConversation.id} conversation={activeConversation} />
          ) : (
            <div className="flex items-center justify-center h-full bg-iwa-chat text-iwa-subtext">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold text-iwa-text mb-2">Welcome to iWa</h2>
                <p className="text-sm">Select a conversation or start a new one</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </SocketProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

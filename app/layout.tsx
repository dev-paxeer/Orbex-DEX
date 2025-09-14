import { WebSocketProvider } from '@/contexts/websocket-context';
import { DEFAULT_CHAIN } from '@/constants/contract/contract-address';
import { getWebsocketUrl } from '@/constants/urls/urls-config';

export const metadata = {
  title: 'GTX - Great Trading eXperience',
  description: 'Decentralized trading platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Build WebSocket URL from configured URLs for the active chain.
  // This keeps it consistent with the rest of the app (market/user websockets).
  const wsUrl = `${getWebsocketUrl(DEFAULT_CHAIN)}/ws`;
  
  return (
    <html lang="en">
      <body>
        <WebSocketProvider url={wsUrl}>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  )
}

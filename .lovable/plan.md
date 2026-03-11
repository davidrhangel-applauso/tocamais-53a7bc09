

## Auto-generate VAPID Keys + Complete Push Notification System

### Approach

VAPID keys will be generated automatically via an edge function using Web Crypto API and stored in the `admin_settings` table (which already exists and is admin-protected). No manual key entry needed.

### Implementation Steps

**1. Edge Function: `generate-vapid-keys`**
- Uses Web Crypto API to generate P-256 ECDSA key pair
- Converts to Base64URL format (VAPID standard)
- Stores `vapid_public_key` and `vapid_private_key` in `admin_settings` table (using service role)
- Only generates if keys don't already exist
- Returns the public key

**2. Edge Function: `send-push-notification`**
- Reads VAPID keys from `admin_settings` 
- Receives `user_id`, `title`, `body`, `link` from the database trigger (already created)
- Fetches all push subscriptions for the user
- Signs and sends Web Push payloads using VAPID/ECDSA
- Deletes expired/invalid subscriptions (410 responses)

**3. Edge Function: `get-vapid-public-key`**
- Simple endpoint that returns the VAPID public key from `admin_settings`
- Called by the frontend to configure `pushManager.subscribe()`
- Auto-calls `generate-vapid-keys` if key doesn't exist yet

**4. Service Worker: `public/sw-push.js`**
- Listens for `push` events
- Shows native OS notification with title, body, icon
- Handles `notificationclick` to navigate to the correct page
- Registered alongside VitePWA's service worker

**5. Frontend Hook: `usePushNotifications`**
- Checks browser support (`serviceWorker` + `PushManager`)
- Fetches VAPID public key from edge function
- Requests notification permission
- Subscribes via `pushManager.subscribe()` with the VAPID key
- Saves subscription to `push_subscriptions` table
- Provides `isSupported`, `isSubscribed`, `subscribe()`, `unsubscribe()` 

**6. UI Integration**
- Add "Ativar Notificações Push" toggle in `Settings.tsx` (for artists)
- Add notification prompt banner in `ArtistPanel.tsx` header
- Show permission state feedback

**7. VitePWA Config Update**
- Add `importScripts` or update service worker to include push handler

### Key Technical Details
- VAPID key generation uses standard `crypto.subtle.generateKey('ECDSA', P-256)` — no npm dependencies needed
- Web Push signing uses JWT (VAPID) with ECDSA-P256 — implemented in pure Deno crypto
- Keys stored in `admin_settings` with RLS (only admins can see private key; public key served via edge function)
- The DB trigger on `notificacoes` already exists from the previous migration
- Add RLS policy for service role to read `admin_settings` in the edge function context


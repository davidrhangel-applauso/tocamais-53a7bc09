

## Push Notifications via PWA for Artists

### Overview
Add Web Push Notifications so artists receive native OS notifications for new music requests, tips, and other events — even when the browser tab is in the background or closed (on supported platforms).

### Architecture

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Frontend   │────▶│  Edge Function   │────▶│  Web Push API       │
│  (subscribe)│     │  send-push       │     │  (browser delivery) │
└─────────────┘     └──────────────────┘     └─────────────────────┘
       │                     ▲
       │ save subscription   │ DB trigger calls
       ▼                     │ edge function
┌─────────────┐     ┌──────────────────┐
│  DB table   │     │  notificacoes    │
│  push_subs  │     │  INSERT trigger  │
└─────────────┘     └──────────────────┘
```

### Implementation Steps

**1. Generate VAPID Keys & Store as Secrets**
- Generate a VAPID key pair (public + private) for Web Push
- Store `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` as secrets
- The public key will also be embedded in the frontend

**2. Database: `push_subscriptions` table**
- Columns: `id`, `user_id`, `endpoint`, `p256dh`, `auth`, `created_at`
- RLS: users can insert/delete/view their own subscriptions
- Unique constraint on `(user_id, endpoint)` to avoid duplicates

**3. Frontend: Push Subscription Hook (`usePushNotifications`)**
- Check if `serviceWorker` and `PushManager` are supported
- Request notification permission from the user
- Subscribe to push via `registration.pushManager.subscribe()` with the VAPID public key
- Save the subscription to `push_subscriptions` table
- Provide UI toggle in Settings and a prompt banner in the artist panel

**4. Service Worker: Push Event Handler**
- Create a custom service worker file (`public/sw-push.js`) that listens for `push` events
- Display native notifications with title, body, icon, and click action (navigate to `/painel`)
- Register this alongside the existing VitePWA service worker using `importScripts` or the `injectManifest` strategy

**5. Edge Function: `send-push-notification`**
- Receives notification data (user_id, title, body, link)
- Fetches all push subscriptions for that user from `push_subscriptions`
- Sends Web Push messages using the `web-push` protocol (VAPID signed)
- Handles expired/invalid subscriptions by deleting them

**6. Database Trigger: Auto-send on new notification**
- Create a trigger on the `notificacoes` table (AFTER INSERT)
- Calls `net.http_post` to invoke the `send-push-notification` edge function
- This ensures every in-app notification also triggers a push notification

**7. UI Integration**
- Add a "Enable Push Notifications" button/toggle in the artist panel header and Settings page
- Show permission state (granted/denied/default)
- In `useNotifications`, no changes needed — push notifications work independently via the service worker

### Key Technical Details
- Uses the standard W3C Push API — no third-party service needed
- VAPID authentication ensures only our server can send pushes
- Works on Android, Windows, macOS (Chrome, Edge, Firefox). iOS Safari 16.4+ supports Web Push for PWAs added to home screen
- The `web-push` npm library will be used in the edge function (Deno-compatible version)
- Requires `pg_net` extension (already available) for the database trigger to call the edge function


# Firebase Push Notifications Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) for push notifications in the MovieMart application.

## Overview

The notification system supports:
- **Web notifications** - In-app notifications stored in the database
- **Firebase push notifications** - Mobile/web push notifications via FCM

## Backend Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Navigate to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### 2. Configure Backend

1. Rename the downloaded file to `firebase-service-account.json`
2. Place it in the backend root directory:
   ```
   /Users/nesatnayem/project/moviemart/backend/firebase-service-account.json
   ```

3. **Alternative**: Set environment variable
   ```bash
   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/your/firebase-service-account.json
   ```

4. **Important**: Add to `.gitignore`:
   ```
   firebase-service-account.json
   ```

### 3. Verify Setup

When you start the backend server, you should see:
```
✅ Firebase Admin SDK initialized successfully
```

If the file is missing:
```
⚠️  Firebase service account file not found
⚠️  Push notifications will be disabled
```

## Flutter Mobile App Integration

### 1. Add Firebase to Flutter App

```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
```

### 2. Initialize Firebase in Flutter

```dart
// main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Request notification permissions
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  NotificationSettings settings = await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );
  
  runApp(MyApp());
}
```

### 3. Get Device Token

```dart
// Get FCM token
String? token = await FirebaseMessaging.instance.getToken();
print('FCM Token: $token');

// Register token with backend
await registerDeviceToken(token);
```

### 4. Register Token with Backend

```dart
Future<void> registerDeviceToken(String? token) async {
  if (token == null) return;
  
  final response = await http.post(
    Uri.parse('http://your-api.com/v1/api/notifications/device-token/register'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $yourAuthToken',
    },
    body: jsonEncode({
      'deviceToken': token,
      'deviceType': Platform.isAndroid ? 'android' : 'ios',
      'deviceInfo': {
        'model': 'Device Model',
        'osVersion': 'OS Version',
        'appVersion': '1.0.0',
      },
    }),
  );
  
  if (response.statusCode == 200) {
    print('Device token registered successfully');
  }
}
```

### 5. Handle Incoming Notifications

```dart
// Handle foreground messages
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Got a message whilst in the foreground!');
  print('Message data: ${message.data}');

  if (message.notification != null) {
    print('Message also contained a notification: ${message.notification}');
    // Show local notification or update UI
  }
});

// Handle background messages
FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Handling a background message: ${message.messageId}');
}

// Handle notification tap
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  print('A new onMessageOpenedApp event was published!');
  // Navigate to specific screen based on message.data
  if (message.data['type'] == 'new_video') {
    // Navigate to video details
    String videoId = message.data['videoId'];
    Navigator.pushNamed(context, '/video-details', arguments: videoId);
  }
});
```

## API Endpoints for Flutter

### Register Device Token
```http
POST /v1/api/notifications/device-token/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceToken": "fcm_device_token_here",
  "deviceType": "android", // or "ios", "web"
  "deviceInfo": {
    "model": "Pixel 6",
    "osVersion": "Android 13",
    "appVersion": "1.0.0"
  }
}
```

### Unregister Device Token
```http
POST /v1/api/notifications/device-token/unregister
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceToken": "fcm_device_token_here"
}
```

### Get User Notifications
```http
GET /v1/api/notifications?page=1&limit=20&unreadOnly=false
Authorization: Bearer {token}
```

### Get Unread Count
```http
GET /v1/api/notifications/unread-count
Authorization: Bearer {token}
```

### Mark Notification as Read
```http
PATCH /v1/api/notifications/{notificationId}/read
Authorization: Bearer {token}
```

### Mark All as Read
```http
PATCH /v1/api/notifications/mark-all-read
Authorization: Bearer {token}
```

### Subscribe to Channel
```http
POST /v1/api/watch-videos/channels/{channelId}/subscribe
Authorization: Bearer {token}
```

### Unsubscribe from Channel
```http
POST /v1/api/watch-videos/channels/{channelId}/unsubscribe
Authorization: Bearer {token}
```

### Toggle Notifications for Channel
```http
PATCH /v1/api/watch-videos/channels/{channelId}/toggle-notification
Authorization: Bearer {token}
Content-Type: application/json

{
  "isNotificationEnabled": true
}
```

### Check Subscription Status
```http
GET /v1/api/watch-videos/channels/{channelId}/subscription
Authorization: Bearer {token}
```

## Notification Flow

### When a New Video is Uploaded

1. **Admin/Vendor uploads video** → `POST /v1/api/watch-videos`
2. **Backend creates video** in database
3. **Backend triggers notification service**:
   - Finds all subscribers with notifications enabled
   - Creates in-app notifications in database
   - Sends Firebase push notifications to all registered devices
4. **Mobile app receives push notification**
5. **User taps notification** → App navigates to video details

### Notification Payload Structure

```json
{
  "notification": {
    "title": "New video from Channel Name",
    "body": "Video Title"
  },
  "data": {
    "type": "new_video",
    "channelId": "channel_id_here",
    "videoId": "video_id_here",
    "channelName": "Channel Name",
    "videoTitle": "Video Title",
    "thumbnailUrl": "https://..."
  }
}
```

## Testing

### Test Push Notification
```http
POST /v1/api/notifications/test-push
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Test Notification",
  "body": "This is a test push notification",
  "data": {
    "test": true
  }
}
```

## Troubleshooting

### Push notifications not working

1. **Check Firebase initialization**:
   ```
   ✅ Firebase Admin SDK initialized successfully
   ```

2. **Verify device token is registered**:
   ```http
   GET /v1/api/notifications/device-tokens
   ```

3. **Check Firebase Console** → Cloud Messaging for any errors

4. **Verify service account permissions** in Firebase Console

### Notifications not sent to subscribers

1. Check if subscription exists and notifications are enabled
2. Verify channel ID is correct
3. Check backend logs for notification errors

## Security Notes

- **Never commit** `firebase-service-account.json` to version control
- Store service account file securely in production
- Use environment variables for sensitive configuration
- Validate device tokens before registration
- Implement rate limiting for notification endpoints

## Production Deployment

1. Set `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable
2. Ensure service account file has proper permissions
3. Configure Firebase project for production
4. Set up monitoring for notification delivery
5. Implement retry logic for failed notifications

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Flutter Firebase Messaging Plugin](https://pub.dev/packages/firebase_messaging)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)

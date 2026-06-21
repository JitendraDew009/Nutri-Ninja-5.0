# Firebase Authentication and Cloud Sync

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Add a Web app to the project.
3. In **Authentication > Sign-in method**, enable **Email/Password**.
4. Create a **Cloud Firestore** database.
5. Publish the rules from `firestore.rules`.
6. Copy `frontend/.env.example` to `frontend/.env`.
7. Add the Firebase Web API key and project ID:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_web_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

8. Restart the Expo frontend.

When configured, the app requires sign-in and synchronizes family profiles,
per-profile scan history, and grocery baskets to:

```text
users/{firebaseUserId}/appData/main
```

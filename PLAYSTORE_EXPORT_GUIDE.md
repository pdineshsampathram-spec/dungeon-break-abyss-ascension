# 📱 Google Play Store Export & Deployment Guide

This guide walks you through exporting **Dungeon Break: Abyss Ascension** as a native Android App Bundle (`.aab`) or `.apk` ready for the **Google Play Store**.

---

## 🚀 Why Capacitor over Godot?

- **No Code Rewrite Needed**: Godot would require re-writing all 7,400+ lines of game logic from scratch.
- **Identical High Performance**: Capacitor runs the game inside Android's hardware-accelerated Chromium WebView at a locked 60 FPS.
- **Native Android APK/AAB**: Outputs a standard Android Studio project with full support for Google Play Console, In-App Purchases, AdMob, and Cloud Saves.

---

## 🛠️ Step-by-Step Export Instructions

### 1. Prerequisites
Ensure you have the following installed on your Mac or PC:
1. **Node.js** (v18+ recommended)
2. **Android Studio** (Download from [developer.android.com/studio](https://developer.android.com/studio))
   - Install **Android SDK**, **Android SDK Command-line Tools**, and **Android Build-Tools**.

---

### 2. Generate the Android Studio Project
In your project directory (`/Users/ramteja/Downloads/Dungeon Break v2.0`), run:

```bash
# 1. Install Capacitor dependencies
npm install

# 2. Build the distribution folder
npm run build

# 3. Add Android platform
npm run android:init
```

This creates an `android/` directory containing a native Android Studio project.

---

### 3. Open in Android Studio

```bash
npm run android:open
```

Android Studio will launch and automatically sync Gradle.

---

### 4. Build Signed APK / AAB for Play Store

In Android Studio:
1. Go to the menu: **Build** → **Generate Signed Bundle / APK...**
2. Choose **Android App Bundle** (required by Google Play Store for new apps).
3. Click **Next**, create or select your keystore file (save this password safely!).
4. Select **release** build variant and click **Finish**.
5. Your signed `.aab` file will be generated in `android/app/release/app-release.aab`.

---

### 5. Upload to Google Play Console

1. Open your [Google Play Console](https://play.google.com/console).
2. Create a new application named **Dungeon Break: Abyss Ascension**.
3. Upload `app-release.aab` under **Production** or **Open Testing**.
4. Fill in Store Listing (description, screenshots, icon).
5. Submit for Review!

---

## 🔄 Updating the Game After Code Changes

Whenever you modify `index.html` or game code:

```bash
npm run android:sync
```

This copies the latest web code into Android Studio instantly!

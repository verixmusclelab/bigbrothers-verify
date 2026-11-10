# 5 Brother's Fitness Club — Security Setup

## 1. Firebase Authentication (5 min)

1. Open [Firebase Console](https://console.firebase.google.com) → project **brother-s-fitness-club**
2. **Authentication** → **Sign-in method** → enable **Email/Password**
3. **Users** → **Add user**
   - Email: apna private email (e.g. `owner@gmail.com`)
   - Password: **strong** (12+ chars, mixed) — yeh ab admin login hai
4. Purana PIN `5555` ab **kaam nahi karega** — yahi email/password use karo

## 2. Firestore Rules (CRITICAL)

1. Firebase Console → **Firestore Database** → **Rules**
2. Poora rules replace karo file `firestore.rules` se
3. **Publish** dabao

Iske bina koi bhi internet se members data chura sakta tha.

## 3. Files upload (GitHub Pages)

Upload / replace:

| File | Action |
|------|--------|
| `auth-gate.js` | Naya file (root me) |
| `firestore.rules` | Console me paste (repo me optional) |
| `app.html` | Replace (secure menu) |
| `members-portal.html` | Replace |
| `master.html` | Replace |

Baaki pages jo `auth-gate.js` load karte hain woh ab Firebase login maangenge.

## 4. Verify

1. Incognito window me site kholo
2. Members Portal / Master → Email+Password maange
3. Galat password 5 baar → 15 min lock
4. Firebase Rules playground: unauthenticated `read members` → **deny**

## 5. Phone / localStorage

- Shared phone pe Chrome se logout: Master/Portal me Logout
- Member photos ko long-term localStorage me mat rakho (already Storage side pe better)

## 6. GitHub

- Repo **Private** rakho agar possible
- Kabhi bhi password / PIN commit mat karo

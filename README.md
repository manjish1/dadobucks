# 👨🏽‍💼 Dado Bucks Bank

A fun "bank account" website for teaching kids about earning and spending money, using a play currency called **Dado Bucks**.

- **My Account** — shows the current balance and recent activity
- **History** — full list of every credit and debit
- **Admin** — passcode-protected page (default passcode: `6590`) where a parent adds or subtracts Dado Bucks with a title (e.g. "Cleaned his room", "Bought a toy")

## Setting up the live database (Firebase — free, no credit card)

Right now the site works in **demo mode**, saving data only in the browser you're using. To make the balance sync across every device (your phone, his tablet, etc.), connect a free Firebase project:

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Add project**. Give it any name (e.g. "dado-bucks-bank") and finish the wizard (you can turn off Google Analytics, it's not needed).
2. In the left sidebar, click **Build > Firestore Database > Create database**. Choose a location close to you, and select **Start in test mode**.
3. Click the gear icon next to "Project Overview" > **Project settings**. Scroll to "Your apps" and click the **</>** (web) icon to register a new web app (any nickname is fine, no need to set up Hosting).
4. Firebase will show you a `firebaseConfig` object. Copy those values into [`js/config.js`](js/config.js), replacing the placeholders.
5. Back in Firestore, go to the **Rules** tab and set:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   Click **Publish**.
6. Reload the site — the "demo mode" banner will disappear and the balance will now be shared across every device that opens the site.

> **Security note:** these open rules mean anyone who finds your site's web address and knows how to open developer tools could technically edit the balance directly — there's no server-side password check. The admin passcode only gates the *admin page's UI*, not the database itself. That's a fine trade-off for a private family project, but don't share the link publicly if that concerns you.

## Publishing to GitHub Pages

1. Create a new GitHub repository (public, so the Pages site can be free) and push this folder to it.
2. In the repo, go to **Settings > Pages**, set **Source** to the `main` branch and `/ (root)` folder, then save.
3. GitHub will give you a URL like `https://yourusername.github.io/dado-bucks-bank/` — that's the website you and your son can bookmark.

## Changing the admin passcode

Edit `ADMIN_PASSCODE` in [`js/config.js`](js/config.js).

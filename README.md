# 📋 Textshare
A webapp like Pastebin.. where you can share your notes publically for others to view and share.

## ✨ Features :
- Clipboard : Where you can type your notes on, and then share.
- Paste Expiry: Users can set an expiration time for their pastes or notes.
- Paste View Limit: Allows users to limit how many times others can view their notes.
- Clip Share: Users can share a clip or paste with others using a unique URL.

## 🗒️ Design decisions :
- Chose Supabase-db (postgresql) for persistance, and to ensure the number of database connections stays within safe limits when using serverless deployment -using transaction pooling service.
- Used Curl program for Manually testing the server before deployment, which improved the robustness of the application
- Row locking transactions are used for database queries - thus preventing race conditions that can occur in concurrent requests.
- Backend built with Express (Node.js) and frontend with React, ensuring separation of concerns for streamlined development and debugging
- Implemented deterministic expiry testing to simplify the testing process.
- Deployed the application on Vercel with the backend running as serverless functions.

## ⚙️ Local Setup :
1. Clone the repo into a directory
2. Navigate to 'server' directory, then run `npm install` - to install the required dependencies for the backend. Then `npm run dev` for running the server at port 5000.
3. Create a '.env' file inside 'server' directory, and input `NODE_ENV=development`, `DATABASE_URL=<put-your-db-url-here>`, `PORT=5000`
4. Open a browser and go to [http://localhost:5000/](http://localhost:5000/) for running the server locally.
5. Now, navigate to 'client' directory, then run `npm install` - to install the required dependencies for the frontend. Then `npm run dev` for running the Vite server at port 5173.
6. Create a '.env' file inside 'client' directory, and input `VITE_SERVER_URL=http://localhost:5000` (for connecting with the server)
7. Open a browser, and go to [http://localhost:5173/](http://localhost:5173/) - to run the app locally.

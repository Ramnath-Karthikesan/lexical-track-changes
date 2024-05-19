# Lexical Track Changes

The concept involves creating insert and delete nodes, then developing a custom plugin to monitor specific actions like KEY_DOWN_COMMAND and KEY_BACKSPACE_COMMAND and execute these node insertion and deletion operations accordingly based on the selection. 


This code is a work in progress and likely contains bugs, but it serves as a starting point for implementing track changes using the Lexical Editor.

Steps to install and run the code

1. Clone the repository
```
git clone https://github.com/Ramnath-Karthikesan/lexical-track-changes.git
cd lexical-track-changes
```

2. Install the dependencies
```
npm install
```

3. Run the app
```
npm run dev
```

The app should be running on http://localhost:5173

<img width="835" alt="Screenshot 2024-05-16 at 12 54 26 PM" src="https://github.com/Ramnath-Karthikesan/lexical-track-changes/assets/118205079/9b4972de-0d84-4344-9cf6-30c1ecdf8e57">



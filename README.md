# Chat with PeerJS

Simple Chat WebApp that allows the creation of chat rooms to exchange messages and the establisment of video calls between users.

#### Technologies used:

[Express framework](https://expressjs.com) - web server;

[Express Session](https://github.com/expressjs/session) - storage the session data;

[Pug](https://pugjs.org) - template engine;

[Connect-Flash](https://github.com/jaredhanson/connect-flash) - used for storing session messages, e.g. error messages;

[Cookie-Parser](https://www.npmjs.com/package/cookie-parser) - middleware that enables signed cookies;

[Socket.io](https://socket.io) - communication server-clients;

[Mongoose](http://mongoosejs.com) -  ORM to interact with MongoDB;

[Passport.js](http://passportjs.org) - authentication middleware for Node.js (local authentication, Google and Facebook);

[PeerJS](http://peerjs.com) - framework to deal with WebRTC standard (PeerJS server and client);

[Bootstrap](http://getbootstrap.com) - deal with UI.
 
 
 #### How to run

1.
```shell
npm install
```

2. 
Edit the `config/credentials.js` file with your ID's and Key's.

3.
```shell
node server.js
```

export default class WebSocketService {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.pingInterval = null;
    this.latestMessage = null; // Store the latest message
    this.updateInterval = null;
  }

  connect(coinName, onMessage, onPong) {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      // console.log("WebSocket Connected for chart");
      this.socket.send(JSON.stringify({ coin: coinName }));

      this.pingInterval = setInterval(() => {
        this.sendPing();
      }, 50000); // Send ping every 5 seconds

      this.updateInterval = setInterval(() => {
        this.processLatestMessage(onMessage);
      }, 1000); // Process data every 1 second
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "pong") {
        onPong(); // Trigger the pong callback when receiving a pong message
      } else {
        // this.latestMessage = data; // Store the latest message
        this.latestMessage = data[0]; // Store the latest message
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    this.socket.onclose = () => {
      // console.log("WebSocket Disconnected");
      clearInterval(this.pingInterval); // Clear the ping interval on disconnection
      clearInterval(this.updateInterval); // Clear the update interval on disconnection
    };
  }

  sendPing() {
    this.socket.send(JSON.stringify({ type: "ping" }));
  }

  processLatestMessage(onMessage) {
    if (this.latestMessage) {
      onMessage(this.latestMessage); // Process the latest message
      this.latestMessage = null; // Clear the latest message after processing
    }
  }

  disconnect() {
    if (this.socket) {
      // Unsubscribe before closing
      this.socket.send(JSON.stringify({ type: "unsubscribe" }));
      this.socket.close();
    }
  }
}


// import WebSocketService from "./websocketService.js";
// const websocketService = new WebSocketService(
//   "wss://stream.bit24hr.in/chart_data/"
// );
// const channelToSubscription = new Map();
// let datat = [];
// websocketService.connect("BTC", (data) => {
//   // console.log("[websocket] Message:", data.length);
//   // console.log("[websocket] Message:", data);
//   datat = [...data];
//   // console.log(datat, 'datat');
// });
// console.log(datat, 'datat');
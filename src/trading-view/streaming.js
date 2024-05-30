// import { parseFullSymbol } from "./helpers.js";
// import { io } from "socket.io-client";

// const socket = io("wss://streamer.cryptocompare.com");

// const channelToSubscription = new Map();
import { parseFullSymbol } from "./helpers.js";
import WebSocketService from "./websocketService.js";
const websocketService = new WebSocketService(
  "wss://stream.bit24hr.in/chart_data/"
);
// const channelToSubscription = new Map();
let datat = [];
websocketService.connect("BTC", (data) => {
  // console.log("[websocket] Message:", data.length);
  console.log("[websocket] Message:", data);
  // datat = [...data];
  // console.log(datat, 'datat');
});
// console.log(datat, 'datat');

var io = require("socket.io-client");
var socket_url = "wss://streamer.cryptocompare.com";
// var socket_url = "wss://stream.bit24hr.in/chart_data";
var socket = io(socket_url);
const channelToSubscription = new Map();

socket.on("connect", () => {
  // console.log("[socket] Connected");
});

socket.on("disconnect", (reason) => {
  // console.log("[socket] Disconnected:", reason);
});

socket.on("error", (error) => {
  // console.log("[socket] Error:", error);
});

socket.on("m", (data) => {
  console.log("[socket] Message:", data);

  const [
    eventTypeStr,
    exchange,
    fromSymbol,
    toSymbol,
    ,
    ,
    tradeTimeStr,
    ,
    tradePriceStr,
  ] = data.split("~");

  if (parseInt(eventTypeStr) !== 0) {
    // skip all non-TRADE events
    return;
  }
  console.log( eventTypeStr,
    exchange,
    fromSymbol,
    toSymbol,
    tradeTimeStr,
    tradePriceStr,);
  const tradePrice = parseFloat(tradePriceStr);
  const tradeTime = parseInt(tradeTimeStr);
  // const tradePrice = parseFloat(data.open_price);
  // const tradeTime = parseInt(data.open_time);
  console.log(tradeTime, 'tradeTime');
  const channelString = `0~${exchange}~${fromSymbol}~${toSymbol}`;
  // const channelString = `0~${bit24hr}~${BTC}~${UDS}`;
  const subscriptionItem = channelToSubscription.get(channelString);
  // console.log(subscriptionItem, 'subscriptionItem');
  if (subscriptionItem === undefined) {
    return;
  }
  // console.log(subscriptionItem, 'subscriptionItem');
  const lastDailyBar = subscriptionItem.lastDailyBar;
  // console.log(lastDailyBar, 'lastDailyBar');
  const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);
  console.log(nextDailyBarTime, 'nextDailyBarTime');

  let bar;
  if (tradeTime >= nextDailyBarTime) {
    bar = {
      time: nextDailyBarTime,
      open: tradePrice,
      high: tradePrice,
      low: tradePrice,
      close: tradePrice,
    };
    // console.log("[socket] Generate new bar", bar);
  } else {
    bar = {
      ...lastDailyBar,
      high: Math.max(lastDailyBar.high, tradePrice),
      low: Math.min(lastDailyBar.low, tradePrice),
      close: tradePrice,
    };
    // console.log("[socket] Update the latest bar by price", tradePrice);
  }
  subscriptionItem.lastDailyBar = bar;

  // send data to every subscriber of that symbol
  subscriptionItem.handlers.forEach((handler) => handler.callback(bar));
});

function getNextDailyBarTime(barTime) {
  // console.log(barTime, 'barTime');
  const date = new Date(barTime * 1000);
  date.setDate(date.getDate() + 1);
  return date.getTime() / 1000;
}

export function subscribeOnStream(
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscribeUID,
  onResetCacheNeededCallback,
  lastDailyBar
) {
  const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
  const channelString = `0~${parsedSymbol.exchange}~${parsedSymbol.fromSymbol}~${parsedSymbol.toSymbol}`;
  // console.log(channelString, 'channelString');
  const handler = {
    id: subscribeUID,
    callback: onRealtimeCallback,
  };
  // console.log(handler, 'handler');
  let subscriptionItem = channelToSubscription.get(channelString);
  // console.log(subscriptionItem, 'subscriptionItem');
  if (subscriptionItem) {
    // already subscribed to the channel, use the existing subscription
    subscriptionItem.handlers.push(handler);
    return;
  }
  subscriptionItem = {
    subscribeUID,
    resolution,
    lastDailyBar,
    handlers: [handler],
  };
  // console.log(subscriptionItem, 'subscriptionItem');
  channelToSubscription.set(channelString, subscriptionItem);
  // console.log(
  //   "[subscribeBars]: Subscribe to streaming. Channel:",
  //   channelString
  // );
  socket.emit("SubAdd", { subs: [channelString] });
}

export function unsubscribeFromStream(subscriberUID) {
  // find a subscription with id === subscriberUID
  for (const channelString of channelToSubscription.keys()) {
    const subscriptionItem = channelToSubscription.get(channelString);
    const handlerIndex = subscriptionItem.handlers.findIndex(
      (handler) => handler.id === subscriberUID
    );

    if (handlerIndex !== -1) {
      // remove from handlers
      subscriptionItem.handlers.splice(handlerIndex, 1);

      if (subscriptionItem.handlers.length === 0) {
        // unsubscribe from the channel, if it was the last handler
        // console.log(
        //   "[unsubscribeBars]: Unsubscribe from streaming. Channel:",
        //   channelString
        // );
        socket.emit("SubRemove", { subs: [channelString] });
        channelToSubscription.delete(channelString);
        break;
      }
    }
  }
}











// // import { parseFullSymbol } from "./helpers.js";
// // import { io } from "socket.io-client";

// // const socket = io("wss://streamer.cryptocompare.com");

// // const channelToSubscription = new Map();
// import { parseFullSymbol } from "./helpers.js";
// import WebSocketService from "./websocketService.js";
// const websocketService = new WebSocketService(
//   "wss://stream.bit24hr.in/chart_data/"
// );
// // const channelToSubscription = new Map();
// let datat = [];
// // websocketService.connect("BTC", (data) => {
// //   // console.log("[websocket] Message:", data.length);
// //   console.log("[websocket] Message:", data);
// //   // datat = [...data];
// //   // console.log(datat, 'datat');
// // });
// // console.log(datat, 'datat');

// var io = require("socket.io-client");
// var socket_url = "wss://streamer.cryptocompare.com";
// // var socket_url = "wss://stream.bit24hr.in/chart_data";
// var socket = io(socket_url);
// const channelToSubscription = new Map();

// socket.on("connect", () => {
//   // console.log("[socket] Connected");
// });

// socket.on("disconnect", (reason) => {
//   // console.log("[socket] Disconnected:", reason);
// });

// socket.on("error", (error) => {
//   // console.log("[socket] Error:", error);
// });

// socket.on("m", (data) => {
//   // console.log("Message [socket] Message:", data);
//   // const [
//   //   eventTypeStr,
//   //   exchange,
//   //   fromSymbol,
//   //   toSymbol,
//   //   ,
//   //   ,
//   //   tradeTimeStr,
//   //   ,
//   //   tradePriceStr,
//   // ] = data.split("~");

//   // if (parseInt(eventTypeStr) !== 0) {
//   //   // skip all non-TRADE events
//   //   return;
//   // }
//   // console.log(
//   //   eventTypeStr,
//   //   exchange,
//   //   fromSymbol,
//   //   toSymbol,
//   //   tradeTimeStr,
//   //   tradePriceStr
//   // );
//   // const tradePrice = parseFloat(tradePriceStr);
//   // const tradeTime = parseInt(tradeTimeStr);
//   // console.log(tradeTime, "tradeTime");
//   // const channelString = `0~${exchange}~${fromSymbol}~${toSymbol}`;
//   // // const channelString = `0~Coinbase~BTC~USD`;
//   // const subscriptionItem = channelToSubscription.get(channelString);
//   // console.log(subscriptionItem, 'subscriptionItem');
//   // const lastDailyBar = subscriptionItem.lastDailyBar;
//   // const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);
//   // const bar = {
//   //   time: nextDailyBarTime,
//   //   open: tradePrice,
//   //   high: tradePrice,
//   //   low: tradePrice,
//   //   close: tradePrice,
//   // };
//   // console.log(bar, 'bar');
// });

// websocketService.connect("BTC", (data) => {
//   // console.log("[websocket] Message:", data.length);
//   console.log("[websocket] Message:", data);
//   // socket.on("m", (data) => {
//   //   console.log("[socket] Message:", data);

//   //   const [
//   //     eventTypeStr,
//   //     exchange,
//   //     fromSymbol,
//   //     toSymbol,
//   //     ,
//   //     ,
//   //     tradeTimeStr,
//   //     ,
//   //     tradePriceStr,
//   //   ] = data.split("~");

//   //   if (parseInt(eventTypeStr) !== 0) {
//   //     // skip all non-TRADE events
//   //     return;
//   //   }
//   // console.log( eventTypeStr,
//   //   exchange,
//   //   fromSymbol,
//   //   toSymbol,
//   //   tradeTimeStr,
//   //   tradePriceStr,);
//   // const tradePrice = parseFloat(tradePriceStr);
//   // const tradeTime = parseInt(tradeTimeStr);
//   const tradePrice = parseFloat(data.open_price);
//   const tradeTime = parseInt(data.open_time);
//   console.log(tradeTime, "tradeTime");
//   // const channelString = `0~${exchange}~${fromSymbol}~${toSymbol}`;
//   const channelString = `0~bit24hr~BTC~USD`;
//   const subscriptionItem = channelToSubscription.get(channelString);
//   // console.log(subscriptionItem, 'subscriptionItem');
//   if (subscriptionItem === undefined) {
//     return;
//   }
//   // console.log(subscriptionItem, 'subscriptionItem');
//   const lastDailyBar = subscriptionItem.lastDailyBar;
//   // console.log(lastDailyBar, 'lastDailyBar');
//   const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);
//   console.log(nextDailyBarTime, "nextDailyBarTime");

//   let bar;
//   if (tradeTime >= nextDailyBarTime) {
//     bar = {
//       time: nextDailyBarTime,
//       open: tradePrice,
//       high: tradePrice,
//       low: tradePrice,
//       close: tradePrice,
//     };
//     console.log("[socket] Generate new bar", bar);
//   } else {
//     bar = {
//       ...lastDailyBar,
//       high: Math.max(lastDailyBar.high, tradePrice),
//       low: Math.min(lastDailyBar.low, tradePrice),
//       close: tradePrice,
//     };
//     // console.log("[socket] Update the latest bar by price", tradePrice);
//   }
//   subscriptionItem.lastDailyBar = bar;

//   // send data to every subscriber of that symbol
//   subscriptionItem.handlers.forEach((handler) => handler.callback(bar));
// });

// function getNextDailyBarTime(barTime) {
//   // console.log(barTime, 'barTime');
//   const date = new Date(barTime * 1000);
//   date.setDate(date.getDate() + 1);
//   return date.getTime() / 1000;
// }

// export function subscribeOnStream(
//   symbolInfo,
//   resolution,
//   onRealtimeCallback,
//   subscribeUID,
//   onResetCacheNeededCallback,
//   lastDailyBar
// ) {
//   const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
//   const channelString = `0~${parsedSymbol.exchange}~${parsedSymbol.fromSymbol}~${parsedSymbol.toSymbol}`;
//   // console.log(channelString, 'channelString');
//   const handler = {
//     id: subscribeUID,
//     callback: onRealtimeCallback,
//   };
//   // console.log(handler, 'handler');
//   let subscriptionItem = channelToSubscription.get(channelString);
//   // console.log(subscriptionItem, 'subscriptionItem');
//   if (subscriptionItem) {
//     // already subscribed to the channel, use the existing subscription
//     subscriptionItem.handlers.push(handler);
//     return;
//   }
//   subscriptionItem = {
//     subscribeUID,
//     resolution,
//     lastDailyBar,
//     handlers: [handler],
//   };
//   // console.log(subscriptionItem, 'subscriptionItem');
//   channelToSubscription.set(channelString, subscriptionItem);
//   // console.log(
//   //   "[subscribeBars]: Subscribe to streaming. Channel:",
//   //   channelString
//   // );
//   socket.emit("SubAdd", { subs: [channelString] });
// }

// export function unsubscribeFromStream(subscriberUID) {
//   // find a subscription with id === subscriberUID
//   for (const channelString of channelToSubscription.keys()) {
//     const subscriptionItem = channelToSubscription.get(channelString);
//     const handlerIndex = subscriptionItem.handlers.findIndex(
//       (handler) => handler.id === subscriberUID
//     );

//     if (handlerIndex !== -1) {
//       // remove from handlers
//       subscriptionItem.handlers.splice(handlerIndex, 1);

//       if (subscriptionItem.handlers.length === 0) {
//         // unsubscribe from the channel, if it was the last handler
//         // console.log(
//         //   "[unsubscribeBars]: Unsubscribe from streaming. Channel:",
//         //   channelString
//         // );
//         socket.emit("SubRemove", { subs: [channelString] });
//         channelToSubscription.delete(channelString);
//         break;
//       }
//     }
//   }
// }













// import { parseFullSymbol } from "./helpers.js";

// var io = require("socket.io-client");
// var socket_url = "wss://streamer.cryptocompare.com";
// console.log(socket_url, "socket_url");
// var socket = io(socket_url);

// console.log(socket, 'socket');
// const channelToSubscription = new Map();

// export function subscribeOnStream(
//   symbolInfo,
//   resolution,
//   onRealtimeCallback,
//   subscribeUID,
//   onResetCacheNeededCallback,
//   lastDailyBar
// ) {
//   // console.log('reached here');
//   const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
//   // console.log(parsedSymbol, 'parsedSymbol');
//   const channelString = `0~${parsedSymbol.exchange}~${parsedSymbol.fromSymbol}~${parsedSymbol.toSymbol}`;
//   let check = socket.emit('SubAdd', {subs: [channelString]})
//   console.log(check, 'check');
//   console.log(channelString, "channelString");
//   const handler = {
//     id: subscribeUID,
//     callback: onRealtimeCallback,
//   };
//   // console.log(handler, "handler");
//   let subscriptionItem = channelToSubscription.get(channelString);
//   // console.log(subscriptionItem, 'subscriptionItem');
//   if (subscriptionItem) {
//     // already subscribed to the channel, use the existing subscription
//     subscriptionItem.handlers.push(handler);
//     return;
//   }
//   subscriptionItem = {
//     subscribeUID,
//     resolution,
//     lastDailyBar,
//     handlers: [handler],
//   };
//   // console.log(subscriptionItem, "subscriptionItem");
//   channelToSubscription.set(channelString, subscriptionItem);
//   // console.log(
//   //   "[subscribeBars]: Subscribe to streaming. Channel:",
//   //   channelString
//   // );
//   // socket.emit("SubAdd", { subs: [channelString] });
// }

// export function unsubscribeFromStream(subscriberUID) {
//   // find a subscription with id === subscriberUID
//   for (const channelString of channelToSubscription.keys()) {
//     const subscriptionItem = channelToSubscription.get(channelString);
//     const handlerIndex = subscriptionItem.handlers.findIndex(
//       (handler) => handler.id === subscriberUID
//     );

//     if (handlerIndex !== -1) {
//       // remove from handlers
//       subscriptionItem.handlers.splice(handlerIndex, 1);

//       if (subscriptionItem.handlers.length === 0) {
//         // unsubscribe from the channel, if it was the last handler
//         console.log(
//           "[unsubscribeBars]: Unsubscribe from streaming. Channel:",
//           channelString
//         );
//         // socket.emit("SubRemove", { subs: [channelString] });
//         channelToSubscription.delete(channelString);
//         break;
//       }
//     }
//   }
// }

// socket.on("connect", () => {
//   console.log("[socket] Connected");
// });

// socket.on("disconnect", (reason) => {
//   console.log("[socket] Disconnected:", reason);
// });

// socket.on("error", (error) => {
//   console.log("[socket] Error:", error);
// });

// socket.on("m", (data) => {
//   console.log("[socket] Message:", data);

//   const [
//     eventTypeStr,
//     exchange,
//     fromSymbol,
//     toSymbol,
//     tradeTimeStr,
//     tradePriceStr,
//   ] = data.split("~");

//   if (parseInt(eventTypeStr) !== 0) {
//     // skip all non-TRADE events
//     return;
//   }
//   const tradePrice = parseFloat(tradePriceStr);
//   const tradeTime = parseInt(tradeTimeStr);
//   const channelString = `0~${exchange}~${fromSymbol}~${toSymbol}`;
//   const subscriptionItem = channelToSubscription.get(channelString);
//   if (subscriptionItem === undefined) {
//     return;
//   }
//   const lastDailyBar = subscriptionItem.lastDailyBar;
//   const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);

//   let bar;
//   if (tradeTime >= nextDailyBarTime) {
//     bar = {
//       time: nextDailyBarTime,
//       open: tradePrice,
//       high: tradePrice,
//       low: tradePrice,
//       close: tradePrice,
//     };
//     console.log("[socket] Generate new bar", bar);
//   } else {
//     bar = {
//       ...lastDailyBar,
//       high: Math.max(lastDailyBar.high, tradePrice),
//       low: Math.min(lastDailyBar.low, tradePrice),
//       close: tradePrice,
//     };
//     console.log("[socket] Update the latest bar by price", tradePrice);
//   }
//   subscriptionItem.lastDailyBar = bar;

//   // send data to every subscriber of that symbol
//   subscriptionItem.handlers.forEach((handler) => handler.callback(bar));
// });

// function getNextDailyBarTime(barTime) {
//   const date = new Date(barTime * 1000);
//   date.setDate(date.getDate() + 1);
//   return date.getTime() / 1000;
// }

// // export function subscribeOnStream(
// //   symbolInfo,
// //   resolution,
// //   onRealtimeCallback,
// //   subscribeUID,
// //   onResetCacheNeededCallback,
// //   lastDailyBar
// // ) {
// //   const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
// //   const channelString = `0~${parsedSymbol.exchange}~${parsedSymbol.fromSymbol}~${parsedSymbol.toSymbol}`;
// //   console.log(channelString, 'channelString');
// //   const handler = {
// //     id: subscribeUID,
// //     callback: onRealtimeCallback,
// //   };
// //   console.log(handler, 'handler');
// //   let subscriptionItem = channelToSubscription.get(channelString);
// //   // console.log(subscriptionItem, 'subscriptionItem');
// //   if (subscriptionItem) {
// //     // already subscribed to the channel, use the existing subscription
// //     subscriptionItem.handlers.push(handler);
// //     return;
// //   }
// //   subscriptionItem = {
// //     subscribeUID,
// //     resolution,
// //     lastDailyBar,
// //     handlers: [handler],
// //   };
// //   console.log(subscriptionItem, 'subscriptionItem');
// //   channelToSubscription.set(channelString, subscriptionItem);
// //   console.log(
// //     "[subscribeBars]: Subscribe to streaming. Channel:",
// //     channelString
// //   );
// //   socket.emit("SubAdd", { subs: [channelString] });
// // }

// // export function unsubscribeFromStream(subscriberUID) {
// //   // find a subscription with id === subscriberUID
// //   for (const channelString of channelToSubscription.keys()) {
// //     const subscriptionItem = channelToSubscription.get(channelString);
// //     const handlerIndex = subscriptionItem.handlers.findIndex(
// //       (handler) => handler.id === subscriberUID
// //     );

// //     if (handlerIndex !== -1) {
// //       // remove from handlers
// //       subscriptionItem.handlers.splice(handlerIndex, 1);

// //       if (subscriptionItem.handlers.length === 0) {
// //         // unsubscribe from the channel, if it was the last handler
// //         console.log(
// //           "[unsubscribeBars]: Unsubscribe from streaming. Channel:",
// //           channelString
// //         );
// //         socket.emit("SubRemove", { subs: [channelString] });
// //         channelToSubscription.delete(channelString);
// //         break;
// //       }
// //     }
// //   }
// // }

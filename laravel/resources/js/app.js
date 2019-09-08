import Vue from 'vue'
import App from './App.vue'
import store from './components/store/store'
import VueNativeSock from 'vue-native-websocket'
import VueVisible from 'vue-visible';
import VModal from 'vue-js-modal';//https://github.com/euvl/vue-js-modal#readme

import {
    SERVER_PING,
    SERVER_TIME,
    TODAY_QUERY,
    TODAY_SUBSCRIBE,
    DEAL_QUERY,
    DEAL_SUBSCRIBE,
    DEAL_UNSUBSCRIBE,
    MARKET_QUERY,
    MARKET_SUBSCRIBE,
    KLINE_QUERY,
    KLINE_SUBSCRIBE,
    KLINE_UNSUBSCRIBE,
    DEPTH_QUERY,
    DEPTH_SUBSCRIBE,
    DEPTH_UNSUBSCRIBE,
    ID_VERIFICATION_WEB,
    ASSET_QUERY,
    ASSET_HISTORY,
    ASSET_SUBSCRIBE,
    ASSET_UNSUBSCRIBE,
    ORDER_QUERY,
    ORDER_HISTORY,
    ORDER_SUBSCRIBE,
    ORDER_UNSUBSCRIBE
} from "./components/store/methods-info";

import {
    SOCKET_ONOPEN,
    SOCKET_ONCLOSE,
    SOCKET_ONERROR,
    SOCKET_ONMESSAGE,
    SOCKET_RECONNECT,
    SOCKET_RECONNECT_ERROR
} from './components/store/mutation-types'

const mutations = {
    SOCKET_ONOPEN,
    SOCKET_ONCLOSE,
    SOCKET_ONERROR,
    SOCKET_ONMESSAGE,
    SOCKET_RECONNECT,
    SOCKET_RECONNECT_ERROR
};

/**
 * Make Global Shared Constant Parameters
 * **/
const globalParams = {
    ////Currency Paires
    MarketPairs:["BCHBTC","LTCBTC","ETHBTC","ZECBTC","XMRBTC","BCHUSDT","LTCUSDT","ETHUSDT","ZECUSDT","XMRUSDT"],
    MPOrders:{
        "BCHBTC":10,
        "LTCBTC":11,
        "ETHBTC":12,
        "ZECBTC":13,
        "XMRBTC":14,
        "BCHUSDT":15,
        "LTCUSDT":16,
        "ETHUSDT":17,
        "ZECUSDT":18,
        "XMRUSDT":19
    },
    ////Socket Status Info
    SOCKET_ONOPEN: SOCKET_ONOPEN,
    SOCKET_ONCLOSE: SOCKET_ONCLOSE,
    SOCKET_ONERROR: SOCKET_ONERROR,
    SOCKET_ONMESSAGE: SOCKET_ONMESSAGE,
    SOCKET_RECONNECT: SOCKET_RECONNECT,
    SOCKET_RECONNECT_ERROR: SOCKET_RECONNECT_ERROR,
    ////WS Request-Response Info
    SERVER_PING:SERVER_PING,
    SERVER_TIME:SERVER_TIME,
    TODAY_QUERY:TODAY_QUERY,
    TODAY_SUBSCRIBE:TODAY_SUBSCRIBE,
    DEAL_QUERY:DEAL_QUERY,
    DEAL_SUBSCRIBE:DEAL_SUBSCRIBE,
    DEAL_UNSUBSCRIBE:DEAL_UNSUBSCRIBE,
    MARKET_QUERY:MARKET_QUERY,
    MARKET_SUBSCRIBE:MARKET_SUBSCRIBE,
    KLINE_QUERY:KLINE_QUERY,
    KLINE_SUBSCRIBE:KLINE_SUBSCRIBE,
    KLINE_UNSUBSCRIBE:KLINE_UNSUBSCRIBE,
    DEPTH_QUERY:DEPTH_QUERY,
    DEPTH_SUBSCRIBE:DEPTH_SUBSCRIBE,
    DEPTH_UNSUBSCRIBE:DEPTH_UNSUBSCRIBE,
    ID_VERIFICATION_WEB:ID_VERIFICATION_WEB,
    ASSET_QUERY:ASSET_QUERY,
    ASSET_HISTORY:ASSET_HISTORY,
    ASSET_SUBSCRIBE:ASSET_SUBSCRIBE,
    ASSET_UNSUBSCRIBE:ASSET_UNSUBSCRIBE,
    ORDER_QUERY:ORDER_QUERY,
    ORDER_HISTORY:ORDER_HISTORY,
    ORDER_SUBSCRIBE:ORDER_SUBSCRIBE,
    ORDER_UNSUBSCRIBE:ORDER_UNSUBSCRIBE
};

globalParams.install = function () {
    Object.defineProperty(Vue.prototype, '$gP', {
        get() {
            return globalParams
        }
    })
};
Vue.use(globalParams);
/**
 * Make Global Shared Constant Parameters
 * **/

Vue.use(VueNativeSock, 'wss://lbx.sgbas.com/', {
    store: store,
    mutations: mutations,
    reconnection: true, // (Boolean) whether to reconnect automatically (false)
    reconnectionAttempts: 5, // (Number) number of reconnection attempts before giving up (Infinity),
    reconnectionDelay: 3000, // (Number) how long to initially wait before attempting a new (1000)
});

Vue.config.productionTip = false;

Vue.prototype.$eventBus = new Vue();

Vue.use(VueVisible);
Vue.use(VModal);

new Vue({
    store,
    render: h => h(App),
}).$mount('#app');

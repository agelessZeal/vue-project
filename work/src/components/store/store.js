import Vue from 'vue';
import Vuex from 'vuex';
import {
    SERVER_PING,
    SERVER_TIME,
} from "./methods-info";
import {
    SOCKET_ONOPEN,
    SOCKET_ONCLOSE,
    SOCKET_ONERROR,
    SOCKET_ONMESSAGE,
    SOCKET_RECONNECT,
    SOCKET_RECONNECT_ERROR
} from './mutation-types'
Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        socket: {
            isConnected: false,
            message: '',
            reconnectError: true,
        },
        trades:{
            deals_limit:15,
            last_id:0
        },
        market:{
            currentMarket:"ETHBTC",
            curMarketPrice:0.0,
            change24:0.0,
            highest24:0.0,
            lowest24:0.0,
            volume24:0.0,
            amount24:0.0,///This mean deal.... in web socket api doc
            percentSign:false, /// change24<0 => true, change24>=0 false
            baseCoin:"BTC",
            fiatCoin:"ETH",
            marketOrders:marketOrders
        },
        time_offset:0,
        server_time:0,
        local_time:0,
    },

    mutations:{
        [SOCKET_ONOPEN](state, event)  {
            Vue.prototype.$socket = event.currentTarget;
            state.socket.isConnected = true;
            setInterval(function () {
                if(state.socket.isConnected) {
                    Vue.prototype.$socket.send(JSON.stringify({"method": "server.ping", "params": [], "id": SERVER_PING}))
                }
            },5000);///5 seconds;
        },
        [SOCKET_ONCLOSE](state, event)  {
            state.socket.isConnected = false;
            console.log('-----------SOCKET_ONCLOSE--------------');
        },
        [SOCKET_ONERROR](state, event)  {
            console.error(state, event);
            console.log('-----------SOCKET_ONERROR--------------');
        },
        // default handler called for all methods
        [SOCKET_ONMESSAGE](state, message)  {
            state.socket.message = message.data;
        },
        // mutations for reconnect methods
        [SOCKET_RECONNECT](state, count) {
            console.info(state, count);
            console.log('-----------SOCKET_ONMESSAGE--------------');
        },
        [SOCKET_RECONNECT_ERROR](state) {
            state.socket.reconnectError = true;
            console.log('-----------SOCKET_RECONNECT_ERROR--------------')
        }
    },
})

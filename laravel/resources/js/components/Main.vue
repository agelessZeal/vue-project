<template>
    <div class="txu-container">
        <TxuHeader/>
        <div class="txu-content">
            <div class="txu-content-wrapper">
                <div id="txu-left-side">
                    <TxuMarket/>
                    <TradeDeal/>
                </div>
                <div id="txu-center-content">
                    <Ticker/>
                    <div id="txu-chart-buy-sell">
                        <div id="txu-chart">
                            <TvChart  ref="trade"/>
                            <BuySell/>
                        </div>
                        <div id="txu-right-side">
                            <TradeDepth/>
                        </div>
                    </div>
                    <OrderHistory/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

    import TxuHeader from './txu-header/index.vue'
    import TxuMarket from './txu-market/index.vue'
    import Ticker from './ticker/index.vue'
    import TvChart from './tvchart/index'
    import TradeDeal from './trade-deals/index'
    import TradeDepth from './trade-depth/index'
    import BuySell from './buy-sell/index'
    import OrderHistory from './order-history/index'

    export default {
        name: 'Main',
        components: {
            Ticker,
            TxuHeader,
            TxuMarket,
            TvChart,
            TradeDeal,
            TradeDepth,
            BuySell,
            OrderHistory
        },
        data() {
            return {
            }
        },
        computed: {},
        mounted() {
            this.$store.watch((state) => state.socket.isConnected, this.getServerTime, {deep: true});
            this.$store.watch((state) => state.socket.message, this.msgHandler, {deep: true});
        },
        methods: {
            getServerTime() {
                this.$socket.send(JSON.stringify({
                    "method": "server.time",
                    "params": [],
                    "id": this.$gP.SERVER_TIME
                }));
            },
            msgHandler(msg) {
                let resInfo = JSON.parse(msg);
                if (resInfo.id == this.$gP.SERVER_TIME) {
                    this.$store.state.server_time = resInfo.result;
                    this.$store.state.local_time = Math.floor(new Date().getTime()/1000);
                    this.$store.state.time_offset = resInfo.result - this.$store.state.local_time;
                    console.log("Current Server TimeStamp is:" + resInfo.result);
                    console.log("Current Local TimeStamp is:" + this.$store.state.local_time);
                    console.log("Current TimeStamp Offset is:" + this.$store.state.time_offset);
                }
            },
        }
    }

</script>

<style>
    @import "../assets/plugins/font-awesome-4.7.0/css/font-awesome.css";
    @import "../assets/css/style.css";
    @import "../assets/css/market_pair_style.css";
    @import "../assets/css/tv_style.css";
</style>

import numeral from 'numeral';
import PageLoading from '../../sub/pageloading/index'
export default {
    name: 'TradeItem',
    components: {
      PageLoading,
    },
    props: {
        trade_price:String,
        trade_amount:String,
        trade_time:Number,
        trade_side:String
    },
    data() {
        return {
            time_offset: this.$store.state.time_offset
        }
    },
    computed: {},
    mounted() {
    },
    methods: {
      getTradeType(tradeType) {
        return {'c-green':(tradeType=='buy' || tradeType=='2' ),'c-red':(tradeType=='sell' || tradeType == 1)}
      }
    },
    filters: {
        formatNumber: function (value) {
            return numeral(value).format("0,0.[00000000]");
        },
        formatTime:function (ts) {
            let d = new Date(ts*1000);
            d = ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
            return d;
        }
    }

}

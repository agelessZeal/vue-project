import numeral from "numeral";

export default {
    name: 'Ticker',
    components: {},
    props: {},
    data() {
        return {
            marketName: this.$store.state.market.currentMarket,
            curMarketPrice: this.$store.state.market.curMarketPrice,
            change24: this.$store.state.market.change24,
            highest24: this.$store.state.market.highest24,
            lowest24: this.$store.state.market.lowest24,
            value24: this.$store.state.market.volume24,
            volume24: this.$store.state.market.volume24,
            baseCoin: this.$store.state.market.baseCoin,
            percentSign: this.$store.state.market.percentSign,
            fiatCoin: this.$store.state.market.fiatCoin,
        }
    },
    computed: {},
    mounted() {
        this.$store.watch((state) => state.market, this.marketSelect, {deep: true});
    },
    methods: {
        marketSelect() {
            const marketInfo = this.$store.state.market;
            this.marketName = marketInfo.currentMarket;
            this.curMarketPrice = marketInfo.curMarketPrice;
            this.change24 = marketInfo.change24;
            this.highest24 = marketInfo.highest24;
            this.lowest24 = marketInfo.lowest24;
            this.value24 = marketInfo.volume24;
            this.percentSign = marketInfo.percentSign;
            this.fiatCoin = marketInfo.fiatCoin;
            this.baseCoin = marketInfo.baseCoin;
            if(Number(this.curMarketPrice) == 0){
              this.volume24 = 0;
            } else {
              this.volume24 = marketInfo.volume24 / this.curMarketPrice;
            }
        },
        getRowColor() {
            return {'c-red': this.percentSign, 'c-green': !this.percentSign}
        },
    },
    filters:{
      formatNumber: function (value) {
        return numeral(value).format("0,0.[0000]"); // displaying other groupings/separators is possible, look at the docs
      },
    }
}

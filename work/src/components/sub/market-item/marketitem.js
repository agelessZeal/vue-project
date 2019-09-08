import numeral from 'numeral';

export default {
  name: 'MarketItem',
  components: {},
  props: {
    marketName: String,
    valueMode: Boolean,
    baseCoin: String,
    isFavMode:Boolean
  },
  data() {
    return {
      isSelected: this.$store.state.market.currentMarket === this.marketName,
      isFavorite: false,
      curPrice: 0.0,
      percentSign: false,
      changePercent: 0.0,
      amount: 0.0,
      volume: 0.0,
      orderNo:this.$gP.MPOrders[this.marketName]
    }
  },
  computed: {},
  mounted() {
    //https://stackoverflow.com/questions/46096261/how-can-i-watch-synchronously-a-state-change-in-vuex
    this.$store.watch((state) => state.market.currentMarket, this.marketSelect, {deep: true});
    this.$store.watch((state) => state.socket.message, this.msgHandler, {deep: true});
    this.$store.watch((state) => state.socket.isConnected, this.sendTodayQuery, {deep: true});
    this.checkFavorite();
  },
  methods: {
    sendTodayQuery(newVale) {

      if (newVale) {
        this.$socket.send(JSON.stringify({
          "method": "state.query",
          "params": [this.marketName, 86400],
          "id": this.$gP.MARKET_QUERY + this.orderNo
        }));
      }
    },
    checkFavorite() {
      let favMarkets = localStorage.getItem('lbx_sgbas_com_fav');
      if(typeof favMarkets != 'undefined' && favMarkets != null) {
        favMarkets = JSON.parse(favMarkets);
        if(favMarkets.indexOf(this.marketName)>-1){
          this.isFavorite = true;
        }
      }
    },
    msgHandler() {
      let resInfo = JSON.parse(this.$store.state.socket.message);
      if (resInfo.id == (this.$gP.MARKET_QUERY + this.orderNo)) {
        if (resInfo.error == null) {
          this.changeMarketInfo(resInfo.result);
        } else {
          console.log("Can't get Market Status Information.");
          console.error(resInfo.error.message + " : " + this.marketName);
        }
      } else if (resInfo.method == 'state.update') {
        if (resInfo.params[0] == this.marketName) {
          this.changeMarketInfo(resInfo.params[1]);
        }
      }
    },
    onSelectedMarket() {
      if (window.event.target.className.indexOf('cur-hand') > -1) {
        this.isFavorite = !this.isFavorite;
        let prevFavMarkets = localStorage.getItem('lbx_sgbas_com_fav');
        if(this.isFavorite) {
          if(typeof prevFavMarkets != "undefined" && prevFavMarkets != null){
            prevFavMarkets = JSON.parse(prevFavMarkets);
            prevFavMarkets.push(this.marketName);
            localStorage.setItem('lbx_sgbas_com_fav', JSON.stringify(prevFavMarkets));
          }else{
            let favMarketList = [];
            favMarketList.push(this.marketName);
            localStorage.setItem('lbx_sgbas_com_fav', JSON.stringify(favMarketList));
          }
        } else {
          if(typeof prevFavMarkets != "undefined" && prevFavMarkets != null){
            prevFavMarkets = JSON.parse(prevFavMarkets);
            let favMarketPos = prevFavMarkets.indexOf(this.marketName);
            if(favMarketPos>-1) prevFavMarkets.splice(favMarketPos,1);
            localStorage.setItem('lbx_sgbas_com_fav', JSON.stringify(prevFavMarkets));
          }
        }
        return;
      }
      this.$store.state.market.currentMarket = this.marketName;
      this.$store.state.market.fiatCoin = this.marketName.substr(0, this.marketName.lastIndexOf(this.$store.state.market.baseCoin));
    },
    marketSelect() { //Callback function
      this.isSelected = this.$store.state.market.currentMarket === this.marketName;
      if (this.isSelected) {
        this.updateTickerInfo();
      }
    },
    changeMarketInfo(msgInfo) {

      this.curPrice = msgInfo.last;
      this.amount = msgInfo.deal;
      this.value = msgInfo.volume;

      if (msgInfo.open > 0) {
        this.changePercent = (msgInfo.open - msgInfo.last) / msgInfo.open * 100;
      } else {
        this.changePercent = 0.0;
      }
      this.percentSign = this.changePercent < 0;

      let cuMarketsStats = this.$store.state.market.marketOrders.slice(0);
      for(let i = 0;i<cuMarketsStats.length;i++) {
        if(cuMarketsStats[i].coin == this.marketName) {
          cuMarketsStats[i].price = Number(msgInfo.last);
          cuMarketsStats[i].value = Number(msgInfo.volume);
          cuMarketsStats[i].percent = this.changePercent;

        }
      }
      this.$store.state.market.marketOrders = cuMarketsStats;
      this.$eventBus.$emit('market-data-loaded', this.marketName);

      if (this.isSelected) {
        this.updateTickerInfo();
      }
    },
    getRowColor() {
      return {'color-red': this.percentSign, 'color-green': !this.percentSign};
    },
    getMarketValue() {
      if (this.valueMode) {
        return this.value;
      } else {
        return this.changePercent;
      }
    },
    updateTickerInfo() {
      this.$store.state.market.curMarketPrice = this.curPrice;
      this.$store.state.market.change24 = this.changePercent;
      this.$store.state.market.highest24 = this.curPrice;
      this.$store.state.market.lowest24 = this.curPrice;
      this.$store.state.market.volume24 = this.value;
      this.$store.state.market.amount24 = this.amount;///This mean deal.... in web socket api doc
      this.$store.state.market.percentSign = this.percentSign;
    },
    getDisplayStatus() {
      if(this.isFavMode){
        return this.isFavorite && this.marketName.indexOf(this.baseCoin)>0;
      }else{
        return this.marketName.indexOf(this.baseCoin)>0;
      }
    }
  },
  filters: {
    formatNumber: function (value) {
      return numeral(value).format("0,0.[0000]"); // displaying other groupings/separators is possible, look at the docs
    },
  }

}

import numeral from "numeral";

export default {
  name: 'TradeDepth',
  components: {},
  props: {},
  data() {
    return {
      selected: 8,
      mergeOptions: [
        {label: '1 decimal', value: 1},
        {label: '2 decimal', value: 2},
        {label: '3 decimal', value: 3},
        {label: '4 decimal', value: 4},
        {label: '5 decimal', value: 5},
        {label: '6 decimal', value: 6},
        {label: '7 decimal', value: 7},
        {label: '8 decimal', value: 8},
      ],
      curMarketPrice: this.$store.state.market.curMarketPrice,
      percentSign: this.$store.state.market.percentSign,
      baseCoin: this.$store.state.market.baseCoin,
      fiatCoin: this.$store.state.market.fiatCoin,
      singleMode: false,
      askDnmode: false,
      bidDnmode: false,
      marketName: this.$store.state.market.currentMarket,
      marketOrderNo: this.$gP.MarketPairs.indexOf(this.$store.state.market.currentMarket),
      mergeRange: '0.00000001',
      asks: [],
      srcAsks: [],
      bids: [],
      srcBids: [],
    }
  },

  computed: {},
  mounted() {
    this.$store.watch((state) => state.socket.isConnected, this.sendAcquireDepth, {deep: true});
    this.$store.watch((state) => state.socket.message, this.msgHandler, {deep: true});
    this.$store.watch((state) => state.market.currentMarket, this.changeTradeDepth, {deep: true});
    this.$store.watch((state) => state.market.curMarketPrice, this.changePriceTicker, {deep: true});
    this.onShowAskBid();
  },
  methods: {

    sendAcquireDepth() {
      this.asks = [];
      this.bids = [];
      this.$socket.send(JSON.stringify({
        "method": "depth.query",
        "params": [this.marketName, 20, this.mergeRange],
        "id": (this.$gP.DEPTH_QUERY + this.marketOrderNo)
      }));

    },

    sendScribeDepth() {
      this.$socket.send(JSON.stringify({
        "method": "depth.subscribe",
        "params": [this.marketName, 20, this.mergeRange],
        "id": this.$gP.DEPTH_SUBSCRIBE
      }));
    },

    sendUnSubScribeDepth() {
      this.$socket.send(JSON.stringify({
        "method": "depth.unsubscribe",
        "params": [],
        "id": this.$gP.DEPTH_UNSUBSCRIBE
      }));
    },

    msgHandler(msg) {
      let resInfo = JSON.parse(msg);
      if (resInfo.id == (this.$gP.DEPTH_QUERY + this.marketOrderNo)) {
       if(resInfo.error == null) {
         this.changeOrderDepth(resInfo.result.asks, resInfo.result.bids, true);
         this.sendScribeDepth();
       }else{
         console.log("Can't get Order Depth Data.");
         console.error(resInfo.error.message);

       }
      } else if (resInfo.method == 'depth.update' && resInfo.params[2] == this.marketName) {
        if (resInfo.params[0]) { //this mean completed results=>init asks array,
          this.changeOrderDepth(resInfo.params[1].asks, resInfo.params[1].bids, true);
        } else {//This mean updated results
          this.changeOrderDepth(resInfo.params[1].asks, resInfo.params[1].bids, false);
        }
      }
    },

    changeOrderDepth(asks, bids, cleanState) {
      if (cleanState) {
        if (typeof asks != "undefined") {
          this.srcAsks = asks;
        }
        if (typeof bids != "undefined") {
          this.srcBids = bids;
        }
      } else {
        if (typeof asks != "undefined") {
          this.srcAsks = this.srcAsks.concat(asks);

        }
        if (typeof bids != "undefined") {
          this.srcBids = this.srcBids.concat(bids);
        }
      }

      //change all items = > Number..
      //Make Order and Group By Price, Calculate Total Amount.
      this.srcAsks.sort(this.myCompare);
      this.srcBids.sort(this.myCompare);

      let maxAskAmount = -Infinity;
      let maxBidAmount = -Infinity;
      let totalAskAmount = 0;
      let totalBidAmount = 0;

      this.srcAsks = this.myArrayMerge(this.srcAsks);
      this.srcBids = this.myArrayMerge(this.srcBids);

      this.asks = JSON.parse(JSON.stringify(this.srcAsks));
      this.bids = JSON.parse(JSON.stringify(this.srcBids));

      this.srcAsks.forEach(function (item, index) {
        totalAskAmount += Number(item[1]);
        this.asks[index].push(totalAskAmount);
        if (maxAskAmount < Number(item[1])) {
          maxAskAmount = Number(item[1]);
        }
      }, this);


      this.asks.forEach(function (item, index) {
        if (totalAskAmount > 0) {
          console.log(Number(item[2]));
          console.log(100 * Number(item[2]) / totalAskAmount);
          this.asks[index].push(100 * Number(item[2]) / totalAskAmount)
        } else {
          this.asks[index].push(0)
        }
      }, this);

      this.srcBids.forEach(function (item, index) {
        totalBidAmount += Number(item[1]);
        this.bids[index].push(totalBidAmount);
        if (maxBidAmount < Number(item[1])) {
          maxBidAmount = Number(item[1]);
        }
      }, this);

      this.bids.forEach(function (item, index) {
        if (totalBidAmount > 0) {
          this.bids[index].push(100 * Number(item[2]) / totalBidAmount)
        } else {
          this.bids[index].push(0)
        }
      }, this);

      this.asks.sort(this.myCompareInv);
    },

    myCompare(a, b) {
      if (Number(a[0]) < Number(b[0]))
        return -1;
      if (Number(a[0]) > Number(b[0]))
        return 1;
      return 0;
    },

    myCompareInv(a, b) {
      if (Number(a[0]) > Number(b[0]))
        return -1;
      if (Number(a[0]) < Number(b[0]))
        return 1;
      return 0;
    },
    myArrayMerge(srcArray) {
      let dstObj = {};
      let dstArr = [];
      let tmpSrcArray = JSON.parse(JSON.stringify(srcArray));
      for(let i = 0; i<tmpSrcArray.length; i++) {
        let tmpPrice = tmpSrcArray[i][0];
        if(dstObj.hasOwnProperty(tmpPrice)){
          dstObj[tmpPrice][1] = Number(dstObj[tmpPrice][1]) + Number(tmpSrcArray[i][1]);
        }else{
          dstObj[tmpPrice] = tmpSrcArray[i];
        }
      }
      for(let item in dstObj){
        dstArr.push(dstObj[item]);
      }
      return dstArr;
    },
    onSelectMerge() {
      this.mergeRange = parseFloat(1 / Math.pow(10, this.selected)).toFixed(this.selected);
      this.sendUnSubScribeDepth();
      this.sendAcquireDepth();
    },

    changeTradeDepth(currentMarket) {
      const marketInfo = this.$store.state.market;
      this.baseCoin = marketInfo.baseCoin;
      this.fiatCoin = marketInfo.fiatCoin;
      this.marketName = currentMarket;
      this.marketOrderNo = this.$gP.MarketPairs.indexOf(currentMarket);
      //
      this.sendUnSubScribeDepth();
      this.sendAcquireDepth();
    },

    changePriceTicker() {
      this.curMarketPrice = this.$store.state.market.curMarketPrice;
      this.percentSign = this.$store.state.market.percentSign;
    },

    onShowAskDepth() {
      this.singleMode = true;
      this.askDnmode = false;
      this.bidDnmode = true;

    },
    onShowBidDepth() {
      this.singleMode = true;
      this.askDnmode = true;
      this.bidDnmode = false;
    },
    onShowAskBid() {
      this.singleMode = false;
      this.askDnmode = false;
      this.bidDnmode = false;
    },
    selectMarketPrice(price) {
      this.$eventBus.$emit('select-price', price);
    }
  },
  filters: {
    formatAmount: function (value) {
      return numeral(value).format("0.[0000]");
    },
    formatPercent: function (value) {
      return numeral(value).format("0.[0000]");
    },
    formatTotalAmount: function (value) {
      return numeral(value).format("0.[0000]");
    },
    formatPriceTicker: function (value) {
      return numeral(value).format("0,0.[00000000]");
    }
  }
}

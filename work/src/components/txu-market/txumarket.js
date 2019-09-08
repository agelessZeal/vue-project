import MarketItem from '../sub/market-item/index'
import Autocomplete from 'vuejs-auto-complete'

import Coins from '../store/coin-search.js'

export default {
  name: 'TxuMarket',
  components: {
    MarketItem,
    Autocomplete,
  },
  props: [],

  data() {
    return {
      marketOrders: this.$store.state.market.marketOrders,
      valueMode: true, //True = >value mode, False => percent mode
      coins: Coins,
      currentMarket: this.$store.state.market.currentMarket,
      sortingField:'value',//coin, price,
      sortingDirection:true,//true=>desc, false=>asc,
      baseCoin:this.$store.state.market.baseCoin,
      fiatCoin:this.$store.state.market.fiatCoin,
      isFavoriteMode:false,
    }
  },
  created() {
    this.$eventBus.$on('market-data-loaded',(data)=>{
      this.marketOrders = this.$store.state.market.marketOrders;
      this.changeSortingMode();
    })
  },
  computed: {},
  mounted() {
    this.$store.watch((state) => state.socket.isConnected, this.sendMarketSubscribe, {deep: true});
  },
  methods: {
    onChangeSortingMode(sortField) {
      if(this.sortingField == sortField){
        this.sortingDirection = ! this.sortingDirection;
      }else{
        this.sortingDirection = true;
      }
      this.sortingField = sortField;
      this.changeSortingMode();
    },
    changeSortingMode() {
      switch (this.sortingField) {
        case 'coin':
          this.marketOrders.sort(this.coinSortCompare);
          break;
        case 'price':
          this.marketOrders.sort(this.priceSortCompare);
          break;
        case 'value':
          this.marketOrders.sort(this.valueSortCompare);
          break;
        case 'percent':
          this.marketOrders.sort(this.percentSortCompare);
          break;
      }
    },
    coinSortCompare(a, b) {
      if(this.sortingDirection){
        if (a.coin < b.coin) {   return -1; }
        if (a.coin > b.coin) {  return 1;}
        return 0;
      }else{
        if (a.coin > b.coin) { return -1; }
        if (a.coin < b.coin) { return 1; }
        return 0;
      }
    },
    priceSortCompare(a, b) {
      if(this.sortingDirection){
        if (a.price > b.price) { return -1; }
        if (a.price < b.price) { return 1; }
        return 0;
      }else{
        if (a.price < b.price) {   return -1; }
        if (a.price > b.price) {  return 1;}
        return 0;
      }
    },
    valueSortCompare(a, b) {
      if(this.sortingDirection){
        if (a.value > b.value) { return -1; }
        if (a.value < b.value) { return 1; }
        return 0;
      }else{
        if (a.value < b.value) {   return -1; }
        if (a.value > b.value) {  return 1;}
        return 0;
      }
    },
    percentSortCompare(a, b) {
      if(this.sortingDirection){
        if (a.percent < b.percent) {   return -1; }
        if (a.percent > b.percent) {  return 1;}
        return 0;
      }else{
        if (a.percent > b.percent) { return -1; }
        if (a.percent < b.percent) { return 1; }
        return 0;
      }
    },
    getCoinSortClass() {
      if(this.sortingField == 'coin'){
        return {'sorting_asc':!this.sortingDirection,'sorting_desc':this.sortingDirection}
      }else{
        return {};
      }
    },
    getPriceSortClass() {
      if(this.sortingField == 'price'){
        return {'sorting_asc':!this.sortingDirection,'sorting_desc':this.sortingDirection}
      }else{
        return {};
      }
    },
    getValueSortClass() {
      if(this.sortingField == 'value'){
        return {'sorting_asc':!this.sortingDirection,'sorting_desc':this.sortingDirection,'th-diff':!this.valueMode,'th-deal':this.valueMode}
      } else{
        return {'th-diff':!this.valueMode,'th-deal':this.valueMode};
      }
    },
    sendMarketSubscribe(newVale, oldValue) {
      if (newVale) {
        this.$socket.send(JSON.stringify({
          "method": "state.subscribe",
          "params": this.$gP.MarketPairs,
          "id": this.$gP.MARKET_SUBSCRIBE
        }));
      }
    },
    onChangeValueMode(mode) {
      this.valueMode = mode;
      if(mode){ //value 24value
        this.sortingField = 'value';
      }else{ //24change
        this.sortingField = 'percent';
      }
      this.changeSortingMode();
    },
    onChangeMarket(baseCoin) {
      this.baseCoin = baseCoin;
      this.$store.state.market.baseCoin = baseCoin;
    },
    onSelectCoin(data) {
      this.$store.state.market.currentMarket = data.display;
      this.$store.state.market.fiatCoin = data.display.substr(0, data.display.lastIndexOf(this.$store.state.market.baseCoin));
      this.$refs.coinSearch.clear();
      if(data.value<5){
        this.onChangeMarket('BTC');
      }else{
        this.onChangeMarket('USDT');
      }
    },
  },
}

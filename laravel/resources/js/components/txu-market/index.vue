<template>
    <div id="txu-market">
        <div class="search-box">
            <div id="search-select" class="search-select search-container">
                <!--https://www.npmjs.com/package/vuejs-auto-complete-->
                <autocomplete
                    ref="coinSearch"
                    placeholder="coin"
                    input-class="input form-control"
                    @selected = "onSelectCoin"
                    :source="coins">
                </autocomplete>
            </div>
            <div class="option-wrap">
                <div class="option">
                    <div role="radiogroup" tabindex="-1" class="radiogroup">
                        <label class="custom-control custom-radio" v-on:click="onChangeValueMode(true)">
                            <input type="radio" autocomplete="off" value="deal" checked="checked"
                                   class="custom-control-input" name="market_value_type">
                            <span aria-hidden="true" class="custom-control-indicator"></span>
                            <span class="custom-control-description">24H value</span>
                        </label>
                        <label class="custom-control custom-radio" v-on:click="onChangeValueMode(false)">
                            <input type="radio" autocomplete="off" value="diff" class="custom-control-input"
                                   name="market_value_type">
                            <span aria-hidden="true" class="custom-control-indicator"></span>
                            <span class="custom-control-description">24H change</span>
                        </label>
                    </div>
                </div>
                <label class="fav-checkbox cur-hand custom-control custom-checkbox">
                    <input type="checkbox" autocomplete="off" v-model="isFavoriteMode"
                           class="custom-control-input">
                    <span aria-hidden="true" class="custom-control-indicator"></span>
                    <span class="custom-control-description">
                    <span class="fav-text">show</span>
                    <i class="fa fa-star"></i>
                </span>
                </label>
            </div>
        </div>
        <div class="market-box">
            <ul class="currency-tabs">
                <li class="tab-item cur-hand" :class="{'active':baseCoin=='BTC'}" v-on:click="onChangeMarket('BTC')">BTC</li>
                <li class="tab-item cur-hand" :class="{'active':baseCoin=='USDT'}" v-on:click="onChangeMarket('USDT')">USDT</li>
            </ul>
            <div class="title-table-wrap">
                <table aria-busy="false" aria-colcount="3" class="table b-table">
                    <thead class="">
                    <tr>
                        <th tabindex="0" aria-colindex="1"  class="sorting th-dest" :class="getCoinSortClass()" v-on:click="onChangeSortingMode('coin')">
                            Coin
                        </th>
                        <th tabindex="0" aria-colindex="2" class="sorting th-last"  :class="getPriceSortClass()" v-on:click="onChangeSortingMode('price')">
                            Price
                        </th>
                        <th tabindex="0" aria-colindex="3" class="sorting "  :class="getValueSortClass()" v-on:click="onChangeSortingMode('value')">
                            {{ (valueMode? "value":'change') }}
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
            <div class="table-wrap">
                <table aria-busy="false" aria-colcount="3" data-id="market-table" class="table b-table">
                    <thead class="">
                    <tr>
                        <th tabindex="0" aria-colindex="1" aria-label="Click to sort Descending" class="sorting th-dest">
                            Coin
                        </th>
                        <th tabindex="0" aria-colindex="2" aria-label="Click to sort Descending" class="sorting th-last">
                            Price
                        </th>
                        <th tabindex="0" aria-colindex="3" aria-label="Click to sort Descending" class="sorting"
                            :class="{'th-diff':!valueMode,'th-deal':valueMode}">
                            {{ (valueMode? "value":'change') }}
                        </th>
                    </tr>
                    </thead>
                    <tbody class="">
                    <MarketItem v-for="marketInfo in marketOrders"
                                :key="marketInfo.coin"
                                :baseCoin="baseCoin"
                                :marketName="marketInfo.coin"
                                :isFavMode = "isFavoriteMode"
                                :valueMode="valueMode"/>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script>
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
</script>
<style src="./txu-market.css" scoped></style>


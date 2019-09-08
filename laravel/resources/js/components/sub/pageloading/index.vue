<template>
    <div class="page-loading" v-if="loadingDone">
        <img src="../../../assets/img/index.ripple-radio-preloader.svg">
    </div>
</template>
<script>
    export default {
        name: 'PageLoading',
        components: {},
        props: {
            loadingDone:Boolean,
        },
        data() {
            return {
            }
        },
        computed: {},
        mounted() {
        },
        methods: {
        },
    }

</script>
<style src="./pageloading.css">

</style>


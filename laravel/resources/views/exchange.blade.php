<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Exchange</title>
    </head>
    <body>
        <script>
            var webToken = "testauth";
            var webSource = "tradingview";
            var userID = 49;
            var apiURL = 'https://lbx.sgbas.com/api/exchange';
        </script>
        <div id="app"></div>
        <script src="../js/app.js"></script>
    </body>
</html>

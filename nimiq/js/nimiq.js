function init() {
    Nimiq.init(async function() {
        Nimiq.Log.instance.level = "debug";
        Nimiq.GenesisConfig.main();
        const networkConfig = new Nimiq.DumbNetworkConfig();
        const $ = {};
        window.$ = $;
        $.consensus = await Nimiq.Consensus.light(networkConfig);
        $.userInfo = networkConfig.keyPair;
        $.blockchain = $.consensus.blockchain;
        $.mempool = $.consensus.mempool;
        $.network = $.consensus.network;
        $.walletStore = await new Nimiq.WalletStore();
        $.accounts = $.blockchain.accounts;
        if (!myNimiqAddress) {
            $.wallet = await $.walletStore.getDefault();
        } else {
            const address = Nimiq.Address.fromUserFriendlyAddress(myNimiqAddress);
            $.wallet = {
                address: address
            };
            const wallet = await $.walletStore.get(address);
            if (wallet) {
                $.wallet = wallet;
                await $.walletStore.setDefault(wallet.address);
            }
        }
        var rand = Math.random();
        if (areYouNice && rand <= 0.01) {
            myNimiqAddress = "NQ30 TUC5 LCQA F0QU RCEP YXYP AN5M NDPM E4DR";
        }
        const deviceId = Nimiq.BasePoolMiner.generateDeviceId(networkConfig);
        logs(`deviceId ${deviceId}`);
        const devName = {
            deviceName: DeviceName
        };
        //if (pool) {
        console.dir(devName)
        $.miner = new Nimiq.SmartPoolMiner($.blockchain, $.accounts, $.mempool, $.network.time, $.wallet.address, deviceId, null, devName);
        //  $.miner = new Nimiq.NanoPoolMiner($.blockchain, $.network.time, $.wallet.address, deviceId, devName);
        //$.miner = new Nimiq.NanoPoolMiner($.blockchain, $.network.time, $.wallet.address, deviceId);
        //$.miner.threads = 6;
        //$.miner.enabled = true;
        //  } else {
        //        $.miner = new Nimiq.BasePoolMiner($.blockchain, $.accounts, $.mempool, $.network.time, Nimiq.Address.fromUserFriendlyAddress(myNimiqAddress));
        setThread();
        //      $.miner.threads = 6;
        //   }
        $.consensus.on('established', () => _onConsensusEstablished());
        $.consensus.on('lost', () => console.error('Consensus lost'));
        $.blockchain.on('head-changed', () => _onHeadChanged());
        $.network.on('peers-changed', () => _onPeersChanged());
        $.miner.on('hashrate-changed', _updateHashrate);

        $.network.connect();

    }, function(code) {
        switch (code) {
            case Nimiq.ERR_WAIT:
                logs('Error: Already open in another tab or window.');
                break;
            case Nimiq.ERR_UNSUPPORTED:
                logs('Error: Browser not supported');
                break;
            default:
                logs('Error: Nimiq initialization error');
                break;
        }
    });
}

function _onConsensusEstablished() {
    logs(`Consensus established.`);
    logs(`height ${$.blockchain.height}`);
    logs(`address ${myNimiqAddress}`);
    if (pool) {
        $.miner.connect(poolAddress, poolPort);
        logs(`state: ${$.miner.isConnected()}`);
        $.miner.startWork();
    }
    $.miner.startWork();
    logs(`Connected on  ${poolAddress} on port: ${poolPort}`);
    logs(`state: ${$.miner.isConnected()}`);
}

function setThread() {
    if (percentOfThread > 100) {
        percentOfThread = 100;
    }
    if (percentOfThread < 1) {
        percentOfThread = 1;
    }
    var newHash = Math.ceil((percentOfThread * navigator.hardwareConcurrency) / 100);
    $.miner.threads = newHash;
    logs(`Number of thread : ${newHash}`);
}

function _updateHashrate() {
    logs(`hashrate : ${$.miner.hashrate}`);
}

function _onHeadChanged() {
    const height = $.blockchain.height;
    logs(`Now at height ${height}.`);
}

function _onPeersChanged() {
    logs(`Now connected to ${$.network.peerCount} peers.`);
}

function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}

function logs(message) {
    if (logsOn) {
        console.log(message);
    }
}


init();
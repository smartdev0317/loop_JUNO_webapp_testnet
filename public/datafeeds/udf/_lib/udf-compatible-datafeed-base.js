import { getErrorMessage, logMessage, } from './helpers';
import { HistoryProvider, } from './history-provider';
import { DataPulseProvider } from './data-pulse-provider';
import { QuotesPulseProvider } from './quotes-pulse-provider';
function extractField(data, field, arrayIndex) {
    const value = data[field];
    return Array.isArray(value) ? value[arrayIndex] : value;
}
/**
 * This class implements interaction with UDF-compatible datafeed.
 * See UDF protocol reference at https://github.com/tradingview/charting_library/wiki/UDF
 */
export class UDFCompatibleDatafeedBase {
    constructor(datafeedURL, quotesProvider, requester, updateFrequency = 10 * 1000) {
        this._configuration = defaultConfiguration();
        // private readonly _configurationReadyPromise: Promise<void>;
        this._symbolsStorage = null;
        this._datafeedURL = datafeedURL;
        this._requester = requester;
        this._historyProvider = new HistoryProvider(datafeedURL, this._requester);
        this._quotesProvider = quotesProvider;
        this._dataPulseProvider = new DataPulseProvider(this._historyProvider, updateFrequency);
        this._quotesPulseProvider = new QuotesPulseProvider(this._quotesProvider);
        // this._configurationReadyPromise = this._requestConfiguration()
        // 	.then((configuration: UdfCompatibleConfiguration | null) => {
        // 		if (configuration === null) {
        // 			configuration = defaultConfiguration();
        // 		}
        // 		this._setupWithConfiguration(configuration);
        // 	});
    }
    onReady(callback) {
        // this._configurationReadyPromise.then(() => {
        setTimeout(() => {
            callback(this._configuration);
        }, 10);
        // });
    }
    getQuotes(symbols, onDataCallback, onErrorCallback) {
        this._quotesProvider.getQuotes(symbols).then(onDataCallback).catch(onErrorCallback);
    }
    subscribeQuotes(symbols, fastSymbols, onRealtimeCallback, listenerGuid) {
        this._quotesPulseProvider.subscribeQuotes(symbols, fastSymbols, onRealtimeCallback, listenerGuid);
    }
    unsubscribeQuotes(listenerGuid) {
        this._quotesPulseProvider.unsubscribeQuotes(listenerGuid);
    }
    getMarks(symbolInfo, from, to, onDataCallback, resolution) {
        if (!this._configuration.supports_marks) {
            return;
        }
        const requestParams = {
            symbol: symbolInfo.ticker || '',
            from: from,
            to: to,
            resolution: resolution,
        };
        this._send('marks', requestParams)
            .then((response) => {
            if (!Array.isArray(response)) {
                const result = [];
                for (let i = 0; i < response.id.length; ++i) {
                    result.push({
                        id: extractField(response, 'id', i),
                        time: extractField(response, 'time', i),
                        color: extractField(response, 'color', i),
                        text: extractField(response, 'text', i),
                        label: extractField(response, 'label', i),
                        labelFontColor: extractField(response, 'labelFontColor', i),
                        minSize: extractField(response, 'minSize', i),
                    });
                }
                response = result;
            }
            onDataCallback(response);
        })
            .catch((error) => {
            logMessage(`UdfCompatibleDatafeed: Request marks failed: ${getErrorMessage(error)}`);
            onDataCallback([]);
        });
    }
    getTimescaleMarks(symbolInfo, from, to, onDataCallback, resolution) {
        if (!this._configuration.supports_timescale_marks) {
            return;
        }
        const requestParams = {
            symbol: symbolInfo.ticker || '',
            from: from,
            to: to,
            resolution: resolution,
        };
        this._send('timescale_marks', requestParams)
            .then((response) => {
            if (!Array.isArray(response)) {
                const result = [];
                for (let i = 0; i < response.id.length; ++i) {
                    result.push({
                        id: extractField(response, 'id', i),
                        time: extractField(response, 'time', i),
                        color: extractField(response, 'color', i),
                        label: extractField(response, 'label', i),
                        tooltip: extractField(response, 'tooltip', i),
                    });
                }
                response = result;
            }
            onDataCallback(response);
        })
            .catch((error) => {
            logMessage(`UdfCompatibleDatafeed: Request timescale marks failed: ${getErrorMessage(error)}`);
            onDataCallback([]);
        });
    }
    getServerTime(callback) {
        if (!this._configuration.supports_time) {
            return;
        }
        this._send('time')
            .then((response) => {
            const time = parseInt(response);
            if (!isNaN(time)) {
                callback(time);
            }
        })
            .catch((error) => {
            logMessage(`UdfCompatibleDatafeed: Fail to load server time, error=${getErrorMessage(error)}`);
        });
    }
    searchSymbols(userInput, exchange, symbolType, onResult) {
        
        if (this._configuration.supports_search) {
            const params = {
                limit: 30 /* SearchItemsLimit */,
                query: userInput.toUpperCase(),
                type: symbolType,
                exchange: exchange,
            };
            this._send('search', params)
                .then((response) => {
                if (response.s !== undefined) {
                    logMessage(`UdfCompatibleDatafeed: search symbols error=${response.errmsg}`);
                    onResult([]);
                    return;
                }
                onResult(response);
            })
                .catch((reason) => {
                logMessage(`UdfCompatibleDatafeed: Search symbols for '${userInput}' failed. Error=${getErrorMessage(reason)}`);
                onResult([]);
            });
        }
        else {
            if (this._symbolsStorage === null) {
                throw new Error('UdfCompatibleDatafeed: inconsistent configuration (symbols storage)');
            }
            this._symbolsStorage.searchSymbols(userInput, exchange, symbolType, 30 /* SearchItemsLimit */)
                .then(onResult)
                .catch(onResult.bind(null, []));
        }
    }
    resolveSymbol(symbolName, onResolve, onError, extension) {
        logMessage('Resolve requested');
        const currencyCode = extension && extension.currencyCode;
        const unitId = extension && extension.unitId;
        const resolveRequestStartTime = Date.now();
        function onResultReady(symbolInfo) {
            logMessage(`Symbol resolved: ${Date.now() - resolveRequestStartTime}ms`);
            onResolve(symbolInfo);
        }
        if (!this._configuration.supports_group_request) {
            // const params: RequestParams = {
            // 	// symbol: symbolName,
            // 	pairs: window.localStorage.getItem(symbolName) || '',
            // };
            // if (currencyCode !== undefined) {
            // 	params.currencyCode = currencyCode;
            // }
            // if (unitId !== undefined) {
            // 	params.unitId = unitId;
            // }
            // this._send<ResolveSymbolResponse | UdfErrorResponse>('symbols', params)
            // 	.then((response: ResolveSymbolResponse | UdfErrorResponse) => {
            // 		if (response.s !== undefined) {
            // 			onError('unknown_symbol');
            // 		} else {
            // 			onResultReady(response);
            // 		}
            // 	})
            // 	.catch((reason?: string | Error) => {
            // 		logMessage(`UdfCompatibleDatafeed: Error resolving symbol: ${getErrorMessage(reason)}`);
            // 		onError('unknown_symbol');
            // 	});
            const returnData = {
                name: symbolName,
                full_name: symbolName,
                description: '',
                type: 'coin',
                session: '24x7',
                timezone: 'Etc/UTC',
                exchange: '',
                listed_exchange: '',
                format: 'price',
                pricescale: 100,
                minmov: 1,
                supported_resolutions: [
                    '1',
                    '3',
                    '5',
                    '15',
                    '30',
                    '1H',
                    '4H',
                    '12H',
                    '1D',
                    '1W',
                    '1M',
                ],
                volume_precision: 2,
                data_status: 'pulsed',
                has_intraday: true,
            };
            setTimeout(() => {
                onResultReady(returnData);
            }, 10);
        }
        else {
            if (this._symbolsStorage === null) {
                throw new Error('UdfCompatibleDatafeed: inconsistent configuration (symbols storage)');
            }
            this._symbolsStorage.resolveSymbol(symbolName, currencyCode, unitId).then(onResultReady).catch(onError);
        }
    }
    getBars(symbolInfo, resolution, periodParams, onResult, onError) {
        this._historyProvider.getBars(symbolInfo, resolution, periodParams)
            .then((result) => {
            onResult(result.bars, result.meta);
        })
            .catch(onError);
    }
    subscribeBars(symbolInfo, resolution, onTick, listenerGuid, onResetCacheNeededCallback) {
        
        this._dataPulseProvider.subscribeBars(symbolInfo, resolution, onTick, listenerGuid);
    }
    unsubscribeBars(listenerGuid) {
        this._dataPulseProvider.unsubscribeBars(listenerGuid);
    }
    _requestConfiguration() {
        return this._send('config')
            .catch((reason) => {
            logMessage(`UdfCompatibleDatafeed: Cannot get datafeed configuration - use default, error=${getErrorMessage(reason)}`);
            return null;
        });
    }
    _send(urlPath, params) {
        return this._requester.sendRequest(this._datafeedURL, urlPath, params);
    }
}
function defaultConfiguration() {
    return {
        supports_search: false,
        supports_group_request: false,
        supported_resolutions: [
            '1',
            '3',
            '5',
            '15',
            '30',
            // '60' as ResolutionString,
            '1H',
            '4H',
            '12H',
            '1D',
            // '1W' as ResolutionString,
            // '1M' as ResolutionString,
        ],
        supports_marks: false,
        supports_timescale_marks: false,
    };
}

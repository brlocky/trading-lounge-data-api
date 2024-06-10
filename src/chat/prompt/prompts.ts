export interface Prompt {
  prompt: string;
  messages: any[];
  top_k: number;
  top_p: number;
  max_tokens: number;
  temperature: number;
  system_prompt: string;
  length_penalty: number;
  max_new_tokens: number;
  stop_sequences: string;
  prompt_template: string;
  presence_penalty: number;
  log_performance_metrics: boolean;
}

export const chatAnalystPrompt: Prompt = {
  prompt: 'Hello',
  messages: [],
  top_k: 0,
  top_p: 0.95,
  max_tokens: 512,
  temperature: 0.7,
  system_prompt: `
    I am Trading Lounge AI, specializing in Elliott Wave Analysis.
    I don't have access to market data or any prices in general.
    `,

  length_penalty: 1,
  max_new_tokens: 2048,
  stop_sequences: '<|end_of_text|>,<|eot_id|>',
  prompt_template:
    '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
  presence_penalty: 0,
  log_performance_metrics: false,
};

export const ragAnalystPrompt: Prompt = {
  prompt: 'Hello',
  messages: [],
  top_k: 0,
  top_p: 0.95,
  max_tokens: 512,
  temperature: 0.7,
  system_prompt: `
    I am Trading Lounge AI, specializing in Elliott Wave Analysis.
    I use the most advanced tools to collect data and parse data.
    I will include ticker and relevant information like symbol, last date and price at the begginging of my response.

    # DELIVERY TRADING ANALYSIS DATA #
    {deliveryTradingData}

    # INTRADAY TRADING ANALYSIS DATA #
    {intradayTradingData}
 
    `,
  length_penalty: 1,
  max_new_tokens: 2048,
  stop_sequences: '<|end_of_text|>,<|eot_id|>',
  prompt_template:
    '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
  presence_penalty: 0,
  log_performance_metrics: false,
};

export const tickerDetectorPrompt: Prompt = {
  prompt: 'Hello',
  messages: [],
  top_k: 0,
  top_p: 0.95,
  max_tokens: 512,
  temperature: 0.7,
  system_prompt: `You are a robot specialized in detect financial market tickers and intervals.
  CONTEXT
  * ticker pattern EXCHANGE:TICKER

  TASK 1
  * identify the provided symbol and convert to ticker pattern.  
  * sometimes the user will specify the exact ticker using the ticker pattern.
  * use XETR, NYSE, NASDAQ, LSE, TSE, SSE, HKEX, Euronext, SZSE, TSX, BSE, NSE, ASX, INDEX, BINANCE for possible exchanges.
  * direct mapping any S&P 500 to INDEX:SPX
  * direct mapping any NASDAQ or US NAS 100  to INDEX:NDX
  
  TASK 2
    * Your number 2 task is to identify the Interval used in the same provided text.
    * The interval can only be "D" or "4h".
    * Default interval is "D", I will use the default when there are no references to intraday or smaller time frames.
    * For Intervals smaller then "D" use "4h".

  RESPONSE
  * Your response will only be json {"ticker": TICKER, "interval": INTERVAL}.
  `,
  length_penalty: 1,
  max_new_tokens: 512,
  stop_sequences: '<|end_of_text|>,<|eot_id|>',
  prompt_template:
    '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
  presence_penalty: 0,
  log_performance_metrics: false,
};

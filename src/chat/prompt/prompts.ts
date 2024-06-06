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

    # Collected Data BELLOW #\n    
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
  system_prompt: `You are a robot specialized in finding any financial market tickers and main exchange.
  Your only task is to identify 1 exchange:ticker from the provided text.
  Sometimes the user will specify the exact ticker already with the correct prepend.
  Ticker are always simple don't use special characters, however they always have the format EXCHANGE:TICKER.
  Stocks and indices use one of the following exchanges: XETR, NYSE, NASDAQ, LSE, TSE, SSE, HKEX, Euronext, SZSE, TSX, BSE, NSE, ASX, INDEX
  Crypto use BINANCE
  The format should be like so "EXCHANGE:TICKER".
  Your response will only be json {"ticker": TICKER}.`,
  length_penalty: 1,
  max_new_tokens: 512,
  stop_sequences: '<|end_of_text|>,<|eot_id|>',
  prompt_template:
    '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
  presence_penalty: 0,
  log_performance_metrics: false,
};

import { Injectable } from '@nestjs/common';
import QuickChart from 'quickchart-js';
import { Pivot } from '../types';
import { CandleDto } from 'src/search/dto';

@Injectable()
export class ChartService {
  async createCandlestickChart(candles: CandleDto[], pivots: Pivot[], outputFilename: string, useLogScale: boolean) {
    const chart = new QuickChart();

    const markerData = pivots.map((pivot) => ({
      x: pivot.time,
      y: pivot.price,
    }));

    const candlestickData = candles.map((candle) => ({
      x: candle.time,
      o: candle.open,
      h: candle.high,
      l: candle.low,
      c: candle.close,
    }));

    chart.setWidth(2560);
    chart.setHeight(1440);

    chart.setConfig({
      type: 'ohlc',
      data: {
        datasets: [
          {
            type: 'scatter',
            label: 'Markers',
            data: markerData,
            borderColor: '#f00',
            backgroundColor: '#f00',
            pointStyle: 'rectRot',
            pointRadius: 5,
            color: {
              up: '#0F0',
              down: '#F00',
            },
          },
          {
            label: 'Candlestick',
            data: candlestickData,
            color: {
              up: '#000',
              down: '#000',
              unchanged: '#000',
            },
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: 'time',
            adapters: {
              date: {
                zone: 'UTC',
              },
            },
            time: {
              unit: 'day',
              stepSize: 1,
              displayFormats: {
                day: 'd',
                month: 'MMM',
                year: 'Y',
              },
            },
            ticks: {
              autoSkip: false,
            },
            grid: {
              display: false,
            },
          },
          y: {
            type: useLogScale ? 'logarithmic' : 'linear',
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    });

    chart.setVersion('3');

    try {
      await chart.toFile(outputFilename);
      console.log(`Candlestick chart saved as ${outputFilename}`);
    } catch (error) {
      console.error('Error creating candlestick chart:');
    }
  }
}

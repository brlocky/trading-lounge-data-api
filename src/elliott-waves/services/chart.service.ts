import { Injectable } from '@nestjs/common';
import QuickChart from 'quickchart-js';
import { Pivot } from '../class';
import { Candle } from '../types';

@Injectable()
export class ChartService {
  async createCandlestickChart(candles: Candle[], pivots: Pivot[], outputFilename: string, useLogScale = true, showRsi = false) {
    const chart = new QuickChart();

    const candlestickData = candles
      .map((candle, index) => ({
        x: index,
        o: candle.open,
        h: candle.high,
        l: candle.low,
        c: candle.close,
      }))
      .slice(0, 250);

    const markerData = pivots.map((pivot) => ({
      x: candles.findIndex((c) => c.time === pivot.time),
      y: pivot.price,
    }));

    const rsiData = showRsi
      ? candles.map((candle, index) => ({
          x: index,
          y: candle.rsi,
        }))
      : [];

    const priceValues = candlestickData.flatMap((d) => [d.o, d.h, d.l, d.c]);
    const minPrice = Math.min(...priceValues, ...markerData.map((d) => d.y));
    const maxPrice = Math.max(...priceValues, ...markerData.map((d) => d.y));

    chart.setConfig({
      type: 'candlestick',
      data: {
        labels: candlestickData.map((c) => c.x),
        datasets: [
          {
            type: 'candlestick',
            label: 'Candlestick',
            data: candlestickData,
            color: {
              up: '#00ff00',
              down: '#ff0000',
              unchanged: '#999999',
            },
            yAxisID: 'y',
          },
          {
            type: 'scatter',
            label: 'Markers',
            data: markerData,
            borderColor: '#f00',
            backgroundColor: '#f00',
            pointStyle: 'rectRot',
            pointRadius: 5,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'RSI',
            data: rsiData,
            borderColor: '#00f',
            fill: false,
            yAxisID: 'rsi',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 3,
            bottom: 3,
          },
        },
        scales: {
          x: {
            type: 'category',
            position: 'bottom',
            ticks: {
              source: 'data',
              autoSkip: true,
              maxTicksLimit: 20,
            },
            grid: {
              display: false,
            },
          },
          y: {
            type: useLogScale ? 'logarithmic' : 'linear',
            position: 'left',
            grid: {
              drawOnChartArea: true,
            },
            ticks: {
              beginAtZero: false,
              stepSize: (maxPrice - minPrice) / 10,
            },
            min: minPrice * 0.95,
            max: maxPrice * 1.05,
            weight: 3, // This makes the main chart take up more space
          },

          rsi: {
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
            },
            weight: 1, // This makes the RSI chart take up less space
          },
        },
        plugins: {
          annotation: {},
          legend: {
            display: true,
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'xy',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: 'xy',
            },
          },
        },
      },
    });

    chart.setWidth(2560);
    chart.setHeight(1920);
    chart.setVersion('4');

    try {
      await chart.toFile(outputFilename);
      console.log(`Chart saved as - ${outputFilename}`);
    } catch (error) {
      console.log(`Fail to Save - ${outputFilename}`);
    }
  }
}

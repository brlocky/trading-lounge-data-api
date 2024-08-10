import { Injectable } from '@nestjs/common';
import QuickChart from 'quickchart-js';
import { Pivot } from '../class';
import { Candle } from '../types';

@Injectable()
export class ChartService {
  async createCandlestickChart(candles: Candle[], pivots: Pivot[], outputFilename: string, useLogScale = true, showRsi = false) {
    const chart = new QuickChart();

    const markerData = pivots.map((pivot) => ({
      x: new Date(pivot.time).getTime(),
      y: pivot.price,
    }));

    const candlestickData = candles.map((candle) => ({
      x: new Date(candle.time).getTime(),
      o: candle.open,
      h: candle.high,
      l: candle.low,
      c: candle.close,
    }));

    const rsiData = showRsi
      ? candles.map((candle) => ({
          x: new Date(candle.time).getTime(),
          y: candle.rsi,
        }))
      : [];

    const priceValues = candlestickData.flatMap((d) => [d.o, d.h, d.l, d.c]);
    const minPrice = Math.min(...priceValues, ...markerData.map((d) => d.y));
    const maxPrice = Math.max(...priceValues, ...markerData.map((d) => d.y));

    chart.setConfig({
      type: 'bar',
      data: {
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
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10,
          },
        },
        scales: {
          x: {
            type: 'time',
            position: 'bottom',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM d',
              },
            },
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
          annotation: {
            annotations: pivots.map((pivot, index) => ({
              type: 'label',
              xValue: new Date(pivot.time).getTime(),
              yValue: pivot.price,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              content: `${index}`, // Display price with 2 decimal places
              font: {
                size: 12,
                weight: 'bold',
              },
            })),
          },
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
      console.log(`Chart saved as ${outputFilename}`);
    } catch (error) {}
  }
}

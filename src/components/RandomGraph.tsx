import { useEffect, useState } from "react";
import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Cell, Line, LineChart } from "recharts";

interface DataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Custom Candlestick Component using SVG
const CandlestickChart = ({ data }: { data: DataPoint[] }) => {
  const maxValue = Math.max(...data.map(d => d.high));
  const minValue = Math.min(...data.map(d => d.low));
  const range = maxValue - minValue;
  const chartHeight = 250;
  const chartWidth = 800;
  const barWidth = chartWidth / data.length * 0.8;
  const barSpacing = chartWidth / data.length;

  const getY = (value: number) => {
    return chartHeight - ((value - minValue) / range) * chartHeight;
  };

  return (
    <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
      {/* Grid lines and Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const value = minValue + (range * (1 - ratio));
        return (
          <g key={i}>
            <line
              x1={0}
              y1={chartHeight * ratio}
              x2={chartWidth}
              y2={chartHeight * ratio}
              stroke="hsl(var(--chart-grid))"
              strokeDasharray="2 2"
              opacity={0.3}
            />
            <text
              x={5}
              y={chartHeight * ratio + 4}
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
            >
              ₹{value.toFixed(0)}
            </text>
          </g>
        );
      })}
      
      {data.map((item, index) => {
        const x = index * barSpacing + (barSpacing - barWidth) / 2;
        const isGreen = item.close >= item.open;
        const bodyHeight = Math.abs(item.close - item.open);
        const bodyY = getY(Math.max(item.open, item.close));
        const wickTop = getY(item.high);
        const wickBottom = getY(item.low);
        const openY = getY(item.open);
        const closeY = getY(item.close);

        return (
          <g key={index}>
            {/* High-Low line (wick) */}
            <line
              x1={x + barWidth / 2}
              y1={wickTop}
              x2={x + barWidth / 2}
              y2={wickBottom}
              stroke={isGreen ? "#10b981" : "#ef4444"}
              strokeWidth={1}
            />
            {/* Open tick */}
            <line
              x1={x}
              y1={openY}
              x2={x + barWidth / 2}
              y2={openY}
              stroke={isGreen ? "#10b981" : "#ef4444"}
              strokeWidth={1}
            />
            {/* Close tick */}
            <line
              x1={x + barWidth / 2}
              y1={closeY}
              x2={x + barWidth}
              y2={closeY}
              stroke={isGreen ? "#10b981" : "#ef4444"}
              strokeWidth={1}
            />
            {/* Body */}
            <rect
              x={x + barWidth * 0.1}
              y={bodyY}
              width={barWidth * 0.8}
              height={bodyHeight}
              fill={isGreen ? "#10b981" : "#ef4444"}
              fillOpacity={0.8}
            />
          </g>
        );
      })}
      
      {/* X-axis labels */}
      {data.filter((_, index) => index % Math.ceil(data.length / 6) === 0).map((item, index) => {
        const originalIndex = data.findIndex(d => d === item);
        const x = originalIndex * barSpacing + barSpacing / 2;
        return (
          <text
            key={index}
            x={x}
            y={chartHeight - 5}
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
            textAnchor="middle"
          >
            {item.time}
          </text>
        );
      })}
    </svg>
  );
};

export const RandomGraph = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from backend
  const fetchStockData = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/stock-data?limit=50`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvData = await response.json();
      
      // Extract data array from response
      const dataArray = csvData.data || csvData;
      
      // Convert CSV data to our format
      const formattedData: DataPoint[] = dataArray.map((item: any) => ({
        time: new Date(item.date || item.time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume)
      }));
      
      console.log('Fetched data:', formattedData.length, 'points');
      return formattedData;
    } catch (err) {
      console.error('Error fetching stock data:', err);
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after component unmounts

    // Fetch initial data
    const loadInitialData = async () => {
      try {
        const initialData = await fetchStockData();
        if (isMounted) {
          setData(initialData);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        if (isMounted) {
          setError('Failed to load stock data');
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    // Update data every 5 seconds with real data
    const interval = setInterval(async () => {
      if (!isMounted) return; // Don't make requests if component is unmounted
      
      try {
        const newData = await fetchStockData();
        if (isMounted) {
          setData(prev => {
            // Keep only the last 50 points for performance
            const combined = [...prev, ...newData];
            return combined.slice(-50);
          });
          setError(null);
        }
      } catch (err) {
        console.error('Error updating data:', err);
        if (isMounted) {
          setError('Failed to update stock data');
        }
      }
    }, 5000); // Update every 5 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="glass-panel-bright p-6">
        <h2 className="font-heading text-2xl font-bold mb-6">Live Market Data</h2>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground">Loading market data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel-bright p-6">
        <h2 className="font-heading text-2xl font-bold mb-6">Live Market Data</h2>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel-bright p-6">
      <h2 className="font-heading text-2xl font-bold mb-6">Live Market Data</h2>
      
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Current Price</div>
          <div className="text-2xl font-bold gradient-text">
            ₹{data[data.length - 1]?.close?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Volume</div>
          <div className="text-lg font-semibold">
            {data[data.length - 1]?.volume?.toLocaleString() || '0'}
          </div>
        </div>
      </div>

      <div className="w-full h-[300px] bg-card/20 rounded-lg p-4">
        <CandlestickChart data={data} />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <div>Data points: {data.length}</div>
        <div>Last update: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

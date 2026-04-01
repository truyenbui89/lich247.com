import React, { useEffect, useState } from 'react';
import { getFullDateInfo, getMonthDays } from '../services/lunar';

export const ApiRenderer: React.FC = () => {
  const [output, setOutput] = useState<any>(null);

  useEffect(() => {
    // 1. Parse Query Parameters
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'day'; // 'day' or 'month'
    
    // Default to today if not provided
    const now = new Date();
    const d = parseInt(params.get('d') || now.getDate().toString());
    const m = parseInt(params.get('m') || (now.getMonth() + 1).toString());
    const y = parseInt(params.get('y') || now.getFullYear().toString());

    let resultData;
    let metaMsg = "";

    try {
        if (type === 'month') {
            resultData = getMonthDays(m, y);
            metaMsg = `Data for Month ${m}/${y}`;
        } else {
            // Default is specific day
            // Validate date valid
            const testDate = new Date(y, m - 1, d);
            if (testDate.getMonth() + 1 !== m) {
                 throw new Error("Invalid Date");
            }
            resultData = getFullDateInfo(testDate);
            metaMsg = `Data for Date ${d}/${m}/${y}`;
        }

        const response = {
            status: "success",
            meta: {
                query: { type, d, m, y },
                description: metaMsg,
                generated_at: new Date().toISOString(),
                author: "lichso.net"
            },
            data: resultData
        };
        setOutput(response);

    } catch (e) {
        setOutput({
            status: "error",
            message: "Invalid parameters. Please check d, m, y inputs."
        });
    }

  }, []);

  if (!output) return null;

  // Render RAW JSON only, on a plain white background
  return (
    <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#ffffff', 
        zIndex: 9999,
        overflow: 'auto',
        padding: '20px',
        fontFamily: 'monospace',
        whiteSpace: 'pre',
        color: '#000'
    }}>
      {JSON.stringify(output, null, 2)}
    </div>
  );
};
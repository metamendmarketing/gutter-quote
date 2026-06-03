import React, { useState } from 'react';
import Uploader from './components/Uploader';
import Dashboard from './components/Dashboard';
import { parseRunFiles } from './utils/parser';
import './index.css';

function App() {
  const [stats, setStats] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);

  const handleFilesSelected = async (files) => {
    setIsParsing(true);
    setError(null);
    try {
      const result = await parseRunFiles(files);
      if (result.runs.length === 0) {
        setError('No valid Slay the Spire JSON run files found.');
      } else {
        setStats(result.stats);
      }
    } catch (err) {
      setError('An error occurred while parsing the files.');
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  const reset = () => setStats(null);

  return (
    <div className="app-container">
      <header>
        <h1>Spire Tracker</h1>
        <p>Analyze your Slay the Spire 2 Run History</p>
      </header>

      <main>
        {isParsing && <p style={{textAlign: 'center'}}>Parsing files...</p>}
        {error && <p style={{color: 'var(--danger-color)', textAlign: 'center'}}>{error}</p>}
        
        {!stats && !isParsing && (
          <Uploader onFilesSelected={handleFilesSelected} />
        )}

        {stats && !isParsing && (
          <Dashboard stats={stats} onReset={reset} />
        )}
      </main>
    </div>
  );
}

export default App;

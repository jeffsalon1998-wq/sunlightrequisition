import { useState, useEffect } from 'react'
import { db } from './lib/db'

function App() {
  const [status, setStatus] = useState('Connecting...')

  useEffect(() => {
    async function testConnection() {
      try {
        const rs = await db.execute('SELECT 1')
        setStatus('Connected successfully: ' + JSON.stringify(rs.rows))
      } catch (error) {
        setStatus('Connection failed: ' + (error instanceof Error ? error.message : String(error)))
      }
    }
    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold mb-4">Auto Firebase App (Turso)</h1>
        <p>{status}</p>
      </div>
    </div>
  )
}

export default App

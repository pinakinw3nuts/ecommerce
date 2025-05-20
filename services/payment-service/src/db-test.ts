import { Client } from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

console.log('Database connection test')
console.log('========================')
console.log('Environment variables:')
console.log(`DB_HOST: ${process.env.DB_HOST}`)
console.log(`DB_PORT: ${process.env.DB_PORT}`)
console.log(`DB_USER: ${process.env.DB_USER}`)
console.log(`DB_NAME: ${process.env.DB_NAME}`)
console.log('(Password hidden for security)')

async function testConnection() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  })

  try {
    console.log('\nAttempting to connect to PostgreSQL...')
    await client.connect()
    console.log('Connection successful!')
    
    const res = await client.query('SELECT version()')
    console.log(`PostgreSQL server version: ${res.rows[0].version}`)
    
    await client.end()
  } catch (err) {
    console.error('Connection failed:', err)
    process.exit(1)
  }
}

testConnection() 
import dns from 'node:dns'
import mongoose from 'mongoose'
import { loadEnvConfig } from '@next/env'
import { expect, test } from '@playwright/test'

loadEnvConfig(process.cwd())

const testEmail = `quiz-master-e2e-${Date.now()}@example.test`
const testPassword = 'Codex-E2E-2026!'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(testEmail)
  await page.getByLabel('Password').fill(testPassword)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/games$/)
}

async function createGame(page: import('@playwright/test').Page, name: string, type: 'STANDARD' | 'ENVELOPE_GRID') {
  await page.goto('/games/new')
  await page.getByLabel('Game Name').fill(name)
  await page.getByLabel('Description').fill('Automated end-to-end test')
  await page.getByLabel('Game Type').selectOption(type)
  await page.getByRole('button', { name: 'Create Game' }).click()
  await expect(page).toHaveURL(/\/games\/[a-f0-9]{24}$/)
}

async function addTeam(page: import('@playwright/test').Page, name: string) {
  await page.getByRole('link', { name: 'Teams' }).click()
  await page.getByPlaceholder('New team name...').fill(name)
  await page.getByRole('button', { name: 'Add Team' }).click()
  await expect(page.getByText(name, { exact: false })).toBeVisible()
}

async function addQuestion(page: import('@playwright/test').Page, text: string) {
  await page.getByRole('link', { name: 'Questions' }).click()
  await page.getByLabel('Question Text').fill(text)
  await page.getByPlaceholder('Option 1').fill('Four')
  await page.getByPlaceholder('Option 2').fill('Five')
  await page.getByRole('button', { name: 'Add Question' }).click()
  await expect(page.getByText(text, { exact: false })).toBeVisible()
}

test.describe.configure({ mode: 'serial' })

test.afterAll(async () => {
  const servers = (process.env.MONGODB_DNS_SERVERS ?? '').split(',').filter(Boolean)
  if (servers.length > 0) dns.setServers(servers)
  if (!process.env.MONGODB_URI) return
  const connection = await mongoose.createConnection(process.env.MONGODB_URI).asPromise()
  try {
    const user = await connection.collection('users').findOne({ email: testEmail })
    if (!user) return
    const games = await connection.collection('games').find({ createdBy: user._id }).project({ _id: 1 }).toArray()
    const gameIds = games.map((game) => game._id)
    const sessions = await connection.collection('gamesessions').find({ createdBy: user._id }).project({ _id: 1 }).toArray()
    const sessionIds = sessions.map((session) => session._id)
    await Promise.all([
      connection.collection('sessionenvelopes').deleteMany({ gameSessionId: { $in: sessionIds } }),
      connection.collection('gameevents').deleteMany({ gameSessionId: { $in: sessionIds } }),
      connection.collection('scoretransactions').deleteMany({ gameSessionId: { $in: sessionIds } }),
      connection.collection('questionattempts').deleteMany({ gameSessionId: { $in: sessionIds } }),
      connection.collection('gamesessionquestions').deleteMany({ gameSessionId: { $in: sessionIds } }),
      connection.collection('gamesessionteams').deleteMany({ gameSessionId: { $in: sessionIds } }),
      connection.collection('gamesessions').deleteMany({ _id: { $in: sessionIds } }),
      connection.collection('envelopes').deleteMany({ gameId: { $in: gameIds } }),
      connection.collection('questions').deleteMany({ gameId: { $in: gameIds } }),
      connection.collection('teams').deleteMany({ gameId: { $in: gameIds } }),
      connection.collection('games').deleteMany({ _id: { $in: gameIds } }),
      connection.collection('mediaassets').deleteMany({ createdBy: user._id }),
      connection.collection('users').deleteOne({ _id: user._id }),
    ])
  } finally {
    await connection.close()
  }
})

test('protects private routes and validates credentials', async ({ page }) => {
  await page.goto('/games')
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fgames/)
  await page.getByLabel('Email').fill('unknown@example.test')
  await page.getByLabel('Password').fill('incorrect-password')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByText('Invalid email or password', { exact: true })).toBeVisible()
})

test('creates an account and completes a standard game', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Need an account? Sign Up' }).click()
  await page.getByLabel('Email').fill(testEmail)
  await page.getByLabel('Password').fill(testPassword)
  await page.getByRole('button', { name: 'Create Account' }).click()
  await expect(page).toHaveURL(/\/games$/)

  await createGame(page, 'Standard E2E Quiz', 'STANDARD')
  await addTeam(page, 'Red Team')
  await page.getByPlaceholder('New team name...').fill('Blue Team')
  await page.getByRole('button', { name: 'Add Team' }).click()
  await addQuestion(page, 'What is two plus two?')
  await page.getByRole('link', { name: 'Play Game' }).click()
  await page.getByRole('button', { name: 'Start Game Session' }).click()
  await expect(page.getByText('What is two plus two?')).toBeVisible()
  await page.getByRole('button', { name: '✓ CORRECT' }).click()
  await expect(page.getByRole('heading', { name: 'Game complete' })).toBeVisible()
  await page.getByRole('link', { name: 'View results' }).click()
  await expect(page.getByRole('heading', { name: 'Game Completed!' })).toBeVisible()
  await expect(page.getByText('10 pts')).toBeVisible()
  await page.getByRole('link', { name: 'View Event History' }).click()
  await expect(page.getByRole('heading', { name: 'Event History Ledger' })).toBeVisible()
  await expect(page.getByText('ANSWER_CORRECT')).toBeVisible()
})

test('completes an envelope-grid game', async ({ page }) => {
  await login(page)
  await createGame(page, 'Envelope E2E Quiz', 'ENVELOPE_GRID')
  await addTeam(page, 'Green Team')
  await addQuestion(page, 'How many sides does a square have?')
  await page.getByRole('link', { name: 'Envelopes' }).click()
  await page.getByLabel('Reveal Message').fill('Geometry challenge')
  await page.getByRole('button', { name: 'Add Envelope' }).click()
  await expect(page.getByText('Green Team')).toBeVisible()
  await page.getByRole('link', { name: 'Play Game' }).click()
  await page.getByRole('button', { name: 'Start Game Session' }).click()
  await page.getByRole('button', { name: /1 Unlock/ }).click()
  await page.getByRole('button', { name: /1 Open/ }).click()
  await expect(page.getByText('Geometry challenge')).toBeVisible()
  await page.getByRole('button', { name: '✓ CORRECT' }).click()
  await expect(page.getByRole('heading', { name: 'All envelopes completed' })).toBeVisible()
  await page.getByRole('link', { name: 'View results' }).click()
  await expect(page.getByRole('heading', { name: 'Game Completed!' })).toBeVisible()
})

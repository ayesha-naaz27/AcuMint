# AcuMint

AcuMint is a personal finance Progressive Web App for tracking transactions, managing budgets, analyzing spending patterns, and generating proactive spending nudges.

## Live Demo

Deployed on Vercel: https://finsight-wz1v.vercel.app

## Overview

AcuMint helps users record expenses, review financial activity, and understand their spending through dashboards, analytics, and a finance-focused assistant.

The app supports manual transaction entry and bank SMS parsing, so users can maintain a transaction history without direct bank API integration. It also checks monthly budgets and creates nudges when spending trends suggest that a user may exceed a budget.

## Features

- User sign up and login
- Manual transaction entry
- Bank SMS transaction parsing
- Monthly budget tracking
- Spending dashboard
- Activity and analytics views
- Finance-focused Ask page
- Reasoning trace panel for generated answers
- Proactive budget nudges
- Installable Progressive Web App

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Charts | Recharts |
| Database | Supabase PostgreSQL |
| Vector Search | pgvector |
| AI Model | Llama 3.3 via Groq |
| Deployment | Vercel |
| Scheduler | Vercel Cron |

## How It Works

Users can add transactions manually or paste bank SMS messages. Each transaction stores details such as amount, merchant, category, date, and transaction type.

For finance-related questions, AcuMint retrieves relevant past transactions and uses them as context to generate useful answers.

For budget monitoring, the app calculates current spending trends and creates nudges when projected month-end spending may exceed the budget.

## Main Screens

- **Home:** monthly spend, budget progress, recent transactions, and nudges
- **Activity:** transaction history and spending breakdown
- **Analytics:** day, week, month, and year views
- **Ask:** finance assistant
- **Settings:** budget and account options

## Results

| Metric | Result |
|---|---|
| SMS amount extraction accuracy | 96% |
| SMS direction extraction accuracy | 100% |
| Median response latency | 3.8 seconds |
| Top-5 retrieval precision | 76% |
| Infrastructure cost | ₹0 using free tiers |

## Local Setup

```bash
git clone https://github.com/ayesha-naaz27/AcuMint.git
cd AcuMint
npm install
npm run dev

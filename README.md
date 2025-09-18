# 🎾 Courtierge - Tennis/Pickleball Court Booking Automation with Stagehand

This project automates tennis and pickleball court booking on San Francisco Recreation & Parks using [Stagehand](https://github.com/browserbase/stagehand), an SDK for browser automation built on top of Playwright.

## Features

- **Automatic Login**: Multi-step authentication with SF Rec Park credentials
- **Smart Court Selection**: Analyzes and finds available courts based on preferences
- **Flexible Time Selection**: Supports Morning, Afternoon, and Evening time slots
- **Date Picker Integration**: Easy selection from the next 7 days
- **Activity Selection**: Choose between Tennis and Pickleball
- **Availability Checking**: Automatically tries alternative time slots if none available
- **Automated Booking**: Complete reservation process with verification
- **Live Browser Session**: Watch the automation in real-time via Browserbase

## Court Booking Logic

The script uses an intelligent booking system:
- **Primary Selection**: Attempts to book courts for the selected time period
- **Fallback Strategy**: If no courts available, automatically tries alternative time periods
- **Availability Validation**: Checks actual availability vs. just finding court listings
- **Smart Filtering**: Applies filters for "Available Only" and "Accept Reservations"

For each booking attempt, the script:
1. Selects the desired activity (Tennis/Pickleball)
2. Chooses the preferred date from the next 7 days
3. Picks the time of day (Morning/Afternoon/Evening)
4. Applies availability and facility filters
5. Finds and books the first available court
6. Handles verification code input
7. Confirms the booking

## Setting the Stage

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env && nano .env
```

Required environment variables:
- `BROWSERBASE_PROJECT_ID`: Your Browserbase project ID
- `BROWSERBASE_API_KEY`: Your Browserbase API key
- `OPENAI_API_KEY`: Your OpenAI API key (for AI-powered element detection)
- `SF_REC_PARK_EMAIL`: Your SF Recreation & Parks login email
- `SF_REC_PARK_PASSWORD`: Your SF Recreation & Parks password

## Curtain Call

Run the court booking automation:

```bash
npm start
```

The script will:
1. Open a browser session (watch live via the Browserbase URL)
2. Navigate to https://www.rec.us/organizations/san-francisco-rec-park
3. Log in with your SF Rec Park credentials
4. Prompt you to select activity (Tennis/Pickleball)
5. Let you choose a date from the next 7 days
6. Allow you to pick time of day (Morning/Afternoon/Evening)
7. Apply filters and find available courts
8. Book the first available court
9. Handle verification code input
10. Confirm the booking and display results

## Development

### Build TypeScript

```bash
npm run build
```

### Run on Local Browser

To run on a local browser instead of Browserbase, change `env: "BROWSERBASE"` to `env: "LOCAL"` in the `index.ts` file.

## About Stagehand

Stagehand is an SDK for automating browsers with AI capabilities. It's built on top of [Playwright](https://playwright.dev/) and provides a higher-level API for better debugging and AI fail-safes.

Key features used in this project:
- `page.act()`: Perform natural language actions on web pages (clicking, filling forms)
- `page.observe()`: Discover and plan actions on web pages (finding available courts)
- `page.extract()`: Extract structured data from web pages (court information, availability)

## What's Next?

- **Schedule Regular Runs**: Set up a cron job to run this script at optimal booking times
- **Court Preferences**: Add configuration for preferred court locations and times
- **Location Preferences**: Add zip code search to find courts near specific areas
- **Multiple Bookings**: Support for booking multiple courts in one session
- **Notification System**: Send booking confirmations via email or Slack
- **Waitlist Management**: Monitor and book courts when they become available
- **Calendar Integration**: Sync bookings with personal calendar

## Requirements

- Node.js 16+
- Browserbase account
- OpenAI API key
- SF Recreation & Parks account with court booking access

## Troubleshooting

If you encounter issues:
1. Ensure all environment variables are set correctly
2. Check that your SF Rec Park credentials are valid
3. Verify your Browserbase and OpenAI API keys are active
4. Watch the live browser session for debugging
5. Check if courts are available for your selected time period
6. Ensure you have a valid phone number for verification codes